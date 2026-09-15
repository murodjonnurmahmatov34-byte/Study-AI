import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { getOwnedNote, processNote } from "@/lib/notes";
import { recordActivity } from "@/lib/progress";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const note = await getOwnedNote(id, user.id);
    if (!note) return jsonError("Note not found.", 404);
    const updated = await processNote(id, user.id);
    await recordActivity(user.id, { type: "reading", itemsCount: 1, noteId: id, durationSeconds: 30 });
    return NextResponse.json({ note: updated });
  } catch (e) {
    return handleApiError(e);
  }
}
