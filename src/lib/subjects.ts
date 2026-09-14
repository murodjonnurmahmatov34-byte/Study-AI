import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notes, subjects } from "@/db/schema";

export async function getUserSubjects(userId: string) {
  return db
    .select({ id: subjects.id, name: subjects.name, color: subjects.color, noteCount: sql<number>`count(${notes.id})::int` })
    .from(subjects)
    .leftJoin(notes, eq(notes.subjectId, subjects.id))
    .where(eq(subjects.userId, userId))
    .groupBy(subjects.id)
    .orderBy(desc(subjects.createdAt));
}

export async function getUserNoteOptions(userId: string) {
  return db
    .select({ id: notes.id, title: notes.title, subjectName: subjects.name, processingStatus: notes.processingStatus, wordCount: notes.wordCount })
    .from(notes)
    .leftJoin(subjects, eq(notes.subjectId, subjects.id))
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt))
    .limit(100);
}
