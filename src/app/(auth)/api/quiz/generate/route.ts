import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions, quizzes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { quizSettingsSchema } from "@/lib/validation";
import { getOwnedNote } from "@/lib/notes";
import { generateQuiz } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const settings = quizSettingsSchema.parse(await req.json());
    const note = await getOwnedNote(settings.noteId, user.id);
    if (!note) return jsonError("Note not found.", 404);

    const generated = await generateQuiz(note.content, { count: settings.count, difficulty: settings.difficulty, type: settings.type });
    if (generated.length < 1) return jsonError("Couldn't generate questions from this note. Try a longer note.", 422);

    const [quiz] = await db
      .insert(quizzes)
      .values({
        userId: user.id,
        noteId: note.id,
        title: `${note.title} — ${settings.difficulty} quiz`,
        difficulty: settings.difficulty,
        questionType: settings.type,
        questionCount: generated.length,
      })
      .returning();
    const inserted = await db
      .insert(questions)
      .values(generated.map((q, i) => ({ quizId: quiz.id, order: i, type: q.type, question: q.question, options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation })))
      .returning({ id: questions.id, order: questions.order, type: questions.type, question: questions.question, options: questions.options });
    // Do not leak correct answers to the client before submission.
    return NextResponse.json({ quiz: { ...quiz, noteTitle: note.title }, questions: inserted.sort((a, b) => a.order - b.order) }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
