import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getUserNoteOptions } from "@/lib/subjects";
import { FlashcardsView } from "@/components/flashcards/flashcards-view";
export const metadata = { title: "Flashcards" };
export const dynamic = "force-dynamic";
export default async function FlashcardsPage() {
  const user = await requireUser();
  const notes = await getUserNoteOptions(user.id);
  return <Suspense><FlashcardsView notes={notes} /></Suspense>;
}
