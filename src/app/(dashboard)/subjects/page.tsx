import { requireUser } from "@/lib/auth";
import { getUserSubjects } from "@/lib/subjects";
import { SubjectsView } from "@/components/dashboard/subjects-view";
export const metadata = { title: "Subjects" };
export const dynamic = "force-dynamic";
export default async function SubjectsPage() {
  const user = await requireUser();
  const subjects = await getUserSubjects(user.id);
  return <SubjectsView initial={subjects} />;
}
