import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getUserNoteOptions } from "@/lib/subjects";
import { QuizView } from "@/components/quiz/quiz-view";
export const metadata = { title: "Quizzes" };
export const dynamic = "force-dynamic";
export default async function QuizPage() {
  const user = await requireUser();
  const notes = await getUserNoteOptions(user.id);
  return <Suspense><QuizView notes={notes} /></Suspense>;
}
