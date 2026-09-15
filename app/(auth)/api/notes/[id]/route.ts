import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { getOwnedNote } from "@/lib/notes";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const note = await getOwnedNote(id, user.id);
    if (!note) return jsonError("Note not found.", 404);
    return NextResponse.json({ note });
  } catch (e) {
    return handleApiError(e);
  }
}

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  subjectId: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    const [note] = await db
      .update(notes)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
      .returning();
    if (!note) return jsonError("Note not found.", 404);
    return NextResponse.json({ note });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const deleted = await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, user.id))).returning({ id: notes.id });
    if (!deleted.length) return jsonError("Note not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
