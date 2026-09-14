import { NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chats, notes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { chatMessageSchema } from "@/lib/validation";
import { getOwnedNote } from "@/lib/notes";
import { askQuestion } from "@/lib/ai";
import { recordActivity } from "@/lib/progress";

export const maxDuration = 60;

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db
      .select({ id: chats.id, title: chats.title, noteId: chats.noteId, noteTitle: notes.title, updatedAt: chats.updatedAt })
      .from(chats)
      .leftJoin(notes, eq(chats.noteId, notes.id))
      .where(eq(chats.userId, user.id))
      .orderBy(desc(chats.updatedAt))
      .limit(30);
    return NextResponse.json({ chats: rows });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = chatMessageSchema.parse(await req.json());
    const note = await getOwnedNote(body.noteId, user.id);
    if (!note) return jsonError("Note not found.", 404);

    let chatId = body.chatId;
    if (chatId) {
      const [existing] = await db.select({ id: chats.id }).from(chats).where(and(eq(chats.id, chatId), eq(chats.userId, user.id)));
      if (!existing) return jsonError("Conversation not found.", 404);
    } else {
      const [created] = await db
        .insert(chats)
        .values({ userId: user.id, noteId: note.id, title: body.message.slice(0, 60) })
        .returning({ id: chats.id });
      chatId = created.id;
    }

    const history = await db
      .select({ role: chatMessages.role, content: chatMessages.content })
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(20);

    const [userMsg] = await db.insert(chatMessages).values({ chatId, role: "user", content: body.message }).returning();
    const answer = await askQuestion(note.content, body.message, history as { role: "user" | "assistant"; content: string }[]);
    const [assistantMsg] = await db.insert(chatMessages).values({ chatId, role: "assistant", content: answer }).returning();
    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));
    await recordActivity(user.id, { type: "chat", itemsCount: 1, durationSeconds: 45, noteId: note.id });
    return NextResponse.json({ chatId, messages: [userMsg, assistantMsg] });
  } catch (e) {
    return handleApiError(e);
  }
}
