import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chats } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const [chat] = await db.select().from(chats).where(and(eq(chats.id, id), eq(chats.userId, user.id)));
    if (!chat) return jsonError("Conversation not found.", 404);
    const messages = await db.select().from(chatMessages).where(eq(chatMessages.chatId, id)).orderBy(asc(chatMessages.createdAt));
    return NextResponse.json({ chat, messages });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const deleted = await db.delete(chats).where(and(eq(chats.id, id), eq(chats.userId, user.id))).returning({ id: chats.id });
    if (!deleted.length) return jsonError("Conversation not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
