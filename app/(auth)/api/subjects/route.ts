import { NextResponse } from "next/server";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { notes, subjects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { subjectSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db
      .select({ id: subjects.id, name: subjects.name, color: subjects.color, createdAt: subjects.createdAt, noteCount: sql<number>`count(${notes.id})::int` })
      .from(subjects)
      .leftJoin(notes, eq(notes.subjectId, subjects.id))
      .where(eq(subjects.userId, user.id))
      .groupBy(subjects.id)
      .orderBy(desc(subjects.createdAt));
    return NextResponse.json({ subjects: rows });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = subjectSchema.parse(await req.json());
    const [subject] = await db.insert(subjects).values({ ...body, userId: user.id }).returning();
    return NextResponse.json({ subject }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
