import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getUserNoteOptions } from "@/lib/subjects";
import { aiProviderLabel } from "@/lib/ai";
import { ChatView } from "@/components/chat/chat-view";
export const metadata = { title: "AI Chat" };
export const dynamic = "force-dynamic";
export default async function ChatPage() {
  const user = await requireUser();
  const notes = await getUserNoteOptions(user.id);
  return <Suspense><ChatView notes={notes} providerLabel={aiProviderLabel()} /></Suspense>;
}
