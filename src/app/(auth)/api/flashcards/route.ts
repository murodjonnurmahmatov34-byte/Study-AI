import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { flashcardProgress, flashcards } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

/** GET /api/flashcards?noteId=... — cards with the user's progress. */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const noteId = new URL(req.url).searchParams.get("noteId");
    if (!noteId) return jsonError("noteId is required.");
    const rows = await db
      .select({
        id: flashcards.id,
        front: flashcards.front,
        back: flashcards.back,
        order: flashcards.order,
        status: flashcardProgress.status,
        reviewCount: flashcardProgress.reviewCount,
        lastReviewedAt: flashcardProgress.lastReviewedAt,
      })
      .from(flashcards)
      .leftJoin(flashcardProgress, and(eq(flashcardProgress.flashcardId, flashcards.id), eq(flashcardProgress.userId, user.id)))
      .where(and(eq(flashcards.noteId, noteId), eq(flashcards.userId, user.id)))
      .orderBy(asc(flashcards.order));
    return NextResponse.json({ flashcards: rows.map((r) => ({ ...r, status: r.status ?? "new", reviewCount: r.reviewCount ?? 0 })) });
  } catch (e) {
    return handleApiError(e);
  }
}
