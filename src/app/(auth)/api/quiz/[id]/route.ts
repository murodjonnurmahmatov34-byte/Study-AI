import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notes, questions, quizzes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Loads a previously generated quiz for retaking (answers hidden). */
export async function GET(_: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const [quiz] = await db
      .select({ id: quizzes.id, title: quizzes.title, difficulty: quizzes.difficulty, questionType: quizzes.questionType, noteId: quizzes.noteId, noteTitle: notes.title })
      .from(quizzes)
      .leftJoin(notes, eq(quizzes.noteId, notes.id))
      .where(and(eq(quizzes.id, id), eq(quizzes.userId, user.id)));
    if (!quiz) return jsonError("Quiz not found.", 404);
    const qs = await db
      .select({ id: questions.id, order: questions.order, type: questions.type, question: questions.question, options: questions.options })
      .from(questions)
      .where(eq(questions.quizId, id))
      .orderBy(asc(questions.order));
    return NextResponse.json({ quiz, questions: qs });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const deleted = await db.delete(quizzes).where(and(eq(quizzes.id, id), eq(quizzes.userId, user.id))).returning({ id: quizzes.id });
    if (!deleted.length) return jsonError("Quiz not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
