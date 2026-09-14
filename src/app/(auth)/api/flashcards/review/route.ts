import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { flashcardProgress, flashcards } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { flashcardReviewSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/progress";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { flashcardId, status } = flashcardReviewSchema.parse(await req.json());
    const [card] = await db.select({ id: flashcards.id, noteId: flashcards.noteId }).from(flashcards).where(and(eq(flashcards.id, flashcardId), eq(flashcards.userId, user.id)));
    if (!card) return jsonError("Flashcard not found.", 404);
    const [progress] = await db
      .insert(flashcardProgress)
      .values({ userId: user.id, flashcardId, status, reviewCount: 1, lastReviewedAt: new Date() })
      .onConflictDoUpdate({
        target: [flashcardProgress.userId, flashcardProgress.flashcardId],
        set: { status, reviewCount: sql`${flashcardProgress.reviewCount} + 1`, lastReviewedAt: new Date() },
      })
      .returning();
    await recordActivity(user.id, { type: "flashcards", itemsCount: 1, durationSeconds: 15, noteId: card.noteId, flashcardsReviewed: 1 });
    return NextResponse.json({ progress });
  } catch (e) {
    return handleApiError(e);
  }
}
