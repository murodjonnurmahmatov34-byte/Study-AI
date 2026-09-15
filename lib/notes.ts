import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { generateSummary } from "./ai";

/** Returns the note only if it belongs to the given user. */
export async function getOwnedNote(noteId: string, userId: string) {
  const [note] = await db.select().from(notes).where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
  return note ?? null;
}

/** Runs AI summarization for a note and persists results/status. */
export async function processNote(noteId: string, userId: string) {
  await db.update(notes).set({ processingStatus: "processing", processingError: null }).where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
  const note = await getOwnedNote(noteId, userId);
  if (!note) throw new Error("Note not found");
  try {
    const result = await generateSummary(note.content);
    const [updated] = await db
      .update(notes)
      .set({ summary: result.summary, keyPoints: result.keyPoints, keyTerms: result.keyTerms, processingStatus: "ready", updatedAt: new Date() })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();
    return updated;
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI processing failed";
    await db.update(notes).set({ processingStatus: "failed", processingError: message }).where(eq(notes.id, noteId));
    throw new Error(message);
  }
}

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
