import { NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { cleanText, detectType, extractText, MAX_FILE_SIZE } from "@/lib/files";
import { countWords, processNote } from "@/lib/notes";
import { recordActivity } from "@/lib/progress";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    const subjectId = (form.get("subjectId") as string) || null;
    const customTitle = (form.get("title") as string) || "";
    if (!(file instanceof File)) return jsonError("No file provided.");
    if (file.size > MAX_FILE_SIZE) return jsonError("File is too large. Maximum size is 10 MB.");
    const type = detectType(file);
    if (!type) return jsonError("Unsupported file type. Upload a PDF, DOCX, TXT, or MD file.");

    let text: string;
    try {
      text = cleanText(await extractText(file, type));
    } catch (e) {
      console.error("[upload] extraction failed", e);
      return jsonError("We couldn't read that file. It may be corrupted or password protected.", 422);
    }
    if (text.length < 20) return jsonError("The file doesn't contain enough readable text (scanned PDFs are not supported yet).", 422);
    if (text.length > 200_000) text = text.slice(0, 200_000);

    const title = customTitle.trim() || file.name.replace(/\.[^.]+$/, "").slice(0, 200);
    const [note] = await db
      .insert(notes)
      .values({
        userId: user.id,
        title,
        content: text,
        subjectId,
        sourceType: type === "md" ? "txt" : type,
        fileName: file.name,
        wordCount: countWords(text),
        processingStatus: "processing",
      })
      .returning();
    await recordActivity(user.id, { type: "upload", itemsCount: 1, noteId: note.id });
    let processed = note;
    try {
      processed = await processNote(note.id, user.id);
    } catch {
      /* failed status persisted */
    }
    return NextResponse.json({ note: processed }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
