import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { questions, quizAttempts, quizzes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { quizSubmitSchema } from "@/lib/validation";
import { recordActivity } from "@/lib/progress";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = quizSubmitSchema.parse(await req.json());
    const [quiz] = await db.select().from(quizzes).where(and(eq(quizzes.id, body.quizId), eq(quizzes.userId, user.id)));
    if (!quiz) return jsonError("Quiz not found.", 404);
    const qs = await db.select().from(questions).where(eq(questions.quizId, quiz.id)).orderBy(asc(questions.order));
    const answerMap = new Map(body.answers.map((a) => [a.questionId, a.answer]));
    const graded = qs.map((q) => {
      const answer = answerMap.get(q.id) ?? "";
      const correct = answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      return { questionId: q.id, question: q.question, options: q.options, answer, correctAnswer: q.correctAnswer, explanation: q.explanation, correct };
    });
    const score = graded.filter((g) => g.correct).length;
    const total = qs.length;
    const percentage = total ? Math.round((score / total) * 1000) / 10 : 0;
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        userId: user.id,
        quizId: quiz.id,
        score,
        total,
        percentage,
        timeTakenSeconds: body.timeTakenSeconds,
        answers: graded.map(({ questionId, answer, correct }) => ({ questionId, answer, correct })),
      })
      .returning();
    await recordActivity(user.id, {
      type: "quiz",
      durationSeconds: body.timeTakenSeconds,
      itemsCount: total,
      noteId: quiz.noteId,
      questionsAnswered: total,
      correctAnswers: score,
    });
    return NextResponse.json({ attempt, results: graded, score, total, percentage });
  } catch (e) {
    return handleApiError(e);
  }
}
