import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { flashcards } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { getOwnedNote } from "@/lib/notes";
import { generateFlashcards } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { noteId, count, replace } = z
      .object({ noteId: z.string().min(1), count: z.coerce.number().int().min(4).max(30).default(10), replace: z.boolean().default(false) })
      .parse(await req.json());
    const note = await getOwnedNote(noteId, user.id);
    if (!note) return jsonError("Note not found.", 404);
    const cards = await generateFlashcards(note.content, count);
    if (!cards.length) return jsonError("Couldn't generate flashcards from this note.", 422);
    if (replace) await db.delete(flashcards).where(and(eq(flashcards.noteId, noteId), eq(flashcards.userId, user.id)));
    const inserted = await db
      .insert(flashcards)
      .values(cards.map((c, i) => ({ userId: user.id, noteId, front: c.front, back: c.back, order: i })))
      .returning();
    return NextResponse.json({ flashcards: inserted.map((c) => ({ ...c, status: "new", reviewCount: 0 })) }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
