import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { subjectSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = subjectSchema.partial().parse(await req.json());
    const [subject] = await db.update(subjects).set(body).where(and(eq(subjects.id, id), eq(subjects.userId, user.id))).returning();
    if (!subject) return jsonError("Subject not found.", 404);
    return NextResponse.json({ subject });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const deleted = await db.delete(subjects).where(and(eq(subjects.id, id), eq(subjects.userId, user.id))).returning({ id: subjects.id });
    if (!deleted.length) return jsonError("Subject not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
