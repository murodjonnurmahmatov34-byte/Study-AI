import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getUserSubjects } from "@/lib/subjects";
import { NotesView } from "@/components/notes/notes-view";

export const metadata = { title: "Notes" };
export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const user = await requireUser();
  const subjects = await getUserSubjects(user.id);
  return (
    <Suspense>
      <NotesView subjects={subjects} />
    </Suspense>
  );
}
