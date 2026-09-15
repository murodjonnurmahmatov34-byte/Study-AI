import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { quizAttempts, quizzes, notes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db
      .select({
        id: quizzes.id,
        title: quizzes.title,
        difficulty: quizzes.difficulty,
        questionType: quizzes.questionType,
        questionCount: quizzes.questionCount,
        createdAt: quizzes.createdAt,
        noteId: quizzes.noteId,
        noteTitle: notes.title,
        attempts: sql<number>`count(${quizAttempts.id})::int`,
        bestScore: sql<number>`coalesce(max(${quizAttempts.percentage}),0)::float`,
      })
      .from(quizzes)
      .leftJoin(notes, eq(quizzes.noteId, notes.id))
      .leftJoin(quizAttempts, eq(quizAttempts.quizId, quizzes.id))
      .where(eq(quizzes.userId, user.id))
      .groupBy(quizzes.id, notes.title)
      .orderBy(desc(quizzes.createdAt))
      .limit(30);
    return NextResponse.json({ quizzes: rows });
  } catch (e) {
    return handleApiError(e);
  }
}
