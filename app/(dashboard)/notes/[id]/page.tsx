import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { flashcards, notes, quizzes, subjects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { NoteDetail } from "@/components/notes/note-detail";

export const dynamic = "force-dynamic";

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [row] = await db
    .select({ note: notes, subjectName: subjects.name, subjectColor: subjects.color })
    .from(notes)
    .leftJoin(subjects, eq(notes.subjectId, subjects.id))
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)));
  if (!row) notFound();
  const [[fc], [qz]] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(flashcards).where(and(eq(flashcards.noteId, id), eq(flashcards.userId, user.id))),
    db.select({ c: sql<number>`count(*)::int` }).from(quizzes).where(and(eq(quizzes.noteId, id), eq(quizzes.userId, user.id))),
  ]);
  return (
    <NoteDetail
      note={{ ...row.note, createdAt: row.note.createdAt.toISOString(), updatedAt: row.note.updatedAt.toISOString() }}
      subjectName={row.subjectName}
      subjectColor={row.subjectColor}
      flashcardCount={fc?.c ?? 0}
      quizCount={qz?.c ?? 0}
    />
  );
}
