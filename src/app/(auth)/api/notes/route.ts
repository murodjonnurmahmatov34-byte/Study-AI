import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { notes, subjects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { noteSchema } from "@/lib/validation";
import { countWords, processNote } from "@/lib/notes";
import { recordActivity } from "@/lib/progress";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const subjectId = url.searchParams.get("subjectId");
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(50, Number(url.searchParams.get("limit") || 12));
    const where = and(
      eq(notes.userId, user.id),
      subjectId ? eq(notes.subjectId, subjectId) : undefined,
      q ? or(ilike(notes.title, `%${q}%`), ilike(notes.content, `%${q}%`)) : undefined,
    );
    const [rows, [{ count }]] = await Promise.all([
      db
        .select({
          id: notes.id,
          title: notes.title,
          subjectId: notes.subjectId,
          subjectName: subjects.name,
          subjectColor: subjects.color,
          sourceType: notes.sourceType,
          wordCount: notes.wordCount,
          processingStatus: notes.processingStatus,
          summary: notes.summary,
          createdAt: notes.createdAt,
          updatedAt: notes.updatedAt,
        })
        .from(notes)
        .leftJoin(subjects, eq(notes.subjectId, subjects.id))
        .where(where)
        .orderBy(desc(notes.updatedAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: sql<number>`count(*)::int` }).from(notes).where(where),
    ]);
    return NextResponse.json({ notes: rows, total: count, page, pages: Math.max(1, Math.ceil(count / limit)) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = noteSchema.parse(await req.json());
    const [note] = await db
      .insert(notes)
      .values({
        userId: user.id,
        title: body.title,
        content: body.content,
        subjectId: body.subjectId || null,
        sourceType: "manual",
        wordCount: countWords(body.content),
        processingStatus: "processing",
      })
      .returning();
    await recordActivity(user.id, { type: "upload", itemsCount: 1, noteId: note.id });
    let processed = note;
    try {
      processed = await processNote(note.id, user.id);
    } catch {
      /* status stored as failed; user can retry */
    }
    return NextResponse.json({ note: processed }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
