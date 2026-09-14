"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, timeAgo } from "@/lib/utils";
import { BookOpen, Bot, MessageSquare, Plus, Send, Sparkles, Trash2, User, History, AlertCircle } from "lucide-react";

type NoteOption = { id: string; title: string; subjectName: string | null };
type Msg = { id: string; role: "user" | "assistant"; content: string; createdAt?: string; error?: boolean };
type ChatItem = { id: string; title: string; noteId: string | null; noteTitle: string | null; updatedAt: string };

const SUGGESTIONS = ["Summarize the main ideas in this note", "What are the key terms I should remember?", "Explain the most difficult concept simply", "Give me 3 practice questions"];

function renderMarkdown(text: string) {
  // Minimal safe markdown: bold, italics, bullets, line breaks
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const html = line
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|\s)_(.+?)_(?=\s|$)/g, "$1<em>$2</em>")
      .replace(/`(.+?)`/g, "<code class='rounded bg-muted px-1 py-0.5 text-xs'>$1</code>");
    const bullet = /^\s*[-•*]\s+/.test(line);
    return <p key={i} className={cn("min-h-[1em]", bullet && "pl-4")} dangerouslySetInnerHTML={{ __html: bullet ? "• " + html.replace(/^\s*[-•*]\s+/, "") : html }} />;
  });
}

export function ChatView({ notes, providerLabel }: { notes: NoteOption[]; providerLabel: string }) {
  const params = useSearchParams();
  const [noteId, setNoteId] = useState(params.get("noteId") ?? notes[0]?.id ?? "");
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chats, setChats] = useState<ChatItem[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadChats = useCallback(async () => {
    const res = await fetch("/api/chat");
    if (res.ok) setChats((await res.json()).chats);
  }, []);
  useEffect(() => { loadChats(); }, [loadChats]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function openChat(c: ChatItem) {
    setShowHistory(false);
    const res = await fetch(`/api/chat/${c.id}`);
    if (!res.ok) return toast.error("Failed to load conversation");
    const data = await res.json();
    setChatId(c.id);
    if (c.noteId) setNoteId(c.noteId);
    setMessages(data.messages);
  }

  function newChat() { setChatId(null); setMessages([]); setInput(""); }

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    if (!noteId) return toast.error("Select a note to chat about");
    setInput("");
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "user", content: message }]);
    setSending(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chatId: chatId ?? undefined, noteId, message }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChatId(data.chatId);
      setMessages((m) => [...m.filter((x) => x.id !== tempId), ...data.messages]);
      loadChats();
    } catch (e) {
      setMessages((m) => [...m, { id: `err-${Date.now()}`, role: "assistant", content: (e as Error).message || "Something went wrong. Please try again.", error: true }]);
    } finally {
      setSending(false);
    }
  }

  async function clearConversation() {
    if (chatId) {
      const res = await fetch(`/api/chat/${chatId}`, { method: "DELETE" });
      if (!res.ok) return toast.error("Failed to clear conversation");
    }
    newChat();
    setConfirmClear(false);
    loadChats();
    toast.success("Conversation cleared");
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  if (notes.length === 0) {
    return (
      <div className="animate-fade-up">
        <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">AI Chat</h1>
        <EmptyState icon={BookOpen} title="Upload a note to start chatting" description="The AI answers questions using your own study material. Add a note first." action={<Button asChild variant="gradient"><Link href="/notes?new=upload">Upload notes</Link></Button>} />
      </div>
    );
  }

  const selectedNote = notes.find((n) => n.id === noteId);

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 animate-fade-up lg:h-[calc(100vh-4rem)]">
      {/* History sidebar */}
      <aside className={cn("w-72 shrink-0 flex-col rounded-2xl border bg-card", showHistory ? "fixed inset-4 z-40 flex shadow-2xl lg:static lg:inset-auto lg:shadow-none" : "hidden lg:flex")}>
        <div className="flex items-center justify-between border-b p-3">
          <span className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> History</span>
          <Button size="sm" variant="outline" onClick={() => { newChat(); setShowHistory(false); }}><Plus className="h-3.5 w-3.5" /> New</Button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {chats === null ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />) : chats.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">No conversations yet</p>
          ) : chats.map((c) => (
            <button key={c.id} onClick={() => openChat(c)} className={cn("w-full rounded-xl p-3 text-left transition hover:bg-muted", chatId === c.id && "bg-primary/10")}>
              <p className="line-clamp-1 text-sm font-medium">{c.title}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{c.noteTitle ?? "Deleted note"} · {timeAgo(c.updatedAt)}</p>
            </button>
          ))}
        </div>
        {showHistory && <div className="border-t p-2 lg:hidden"><Button variant="ghost" className="w-full" onClick={() => setShowHistory(false)}>Close</Button></div>}
      </aside>

      {/* Chat pane */}
      <div className="flex min-w-0 flex-1 flex-col rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <Button size="sm" variant="ghost" className="lg:hidden" onClick={() => setShowHistory(true)}><History className="h-4 w-4" /></Button>
          <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" /> Chatting about:</div>
          <Select value={noteId} onChange={(e) => { setNoteId(e.target.value); newChat(); }} className="h-9 flex-1 min-w-[160px] sm:max-w-xs">
            {notes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
          </Select>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex" title={providerLabel}>{providerLabel.startsWith("Local") ? "Local engine" : providerLabel}</Badge>
            <Button size="sm" variant="ghost" onClick={() => setConfirmClear(true)} disabled={messages.length === 0}><Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Clear</span></Button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent p-4 text-white shadow-lg shadow-primary/30"><Bot className="h-8 w-8" /></div>
              <h2 className="text-lg font-semibold">Ask anything about “{selectedNote?.title}”</h2>
              <p className="mt-1 text-sm text-muted-foreground">Answers are grounded in your uploaded material. If something isn’t in your notes, I’ll tell you.</p>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-xl border p-3 text-left text-sm transition hover:border-primary/40 hover:bg-muted">{s}</button>)}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", m.role === "user" ? "bg-muted" : m.error ? "bg-red-500/10 text-red-500" : "bg-gradient-to-br from-primary to-accent text-white")}>
                {m.role === "user" ? <User className="h-4 w-4" /> : m.error ? <AlertCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]", m.role === "user" ? "rounded-tr-sm bg-primary text-primary-foreground" : m.error ? "rounded-tl-sm border border-red-500/30 bg-red-500/5" : "rounded-tl-sm bg-muted")}>
                {m.role === "user" ? <p className="whitespace-pre-wrap">{m.content}</p> : renderMarkdown(m.content)}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white"><Bot className="h-4 w-4" /></div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${i * 150}ms` }} />)}
                <span className="ml-2 text-xs text-muted-foreground">Reading your notes…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={(e: FormEvent) => { e.preventDefault(); send(); }} className="border-t p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} rows={1} placeholder="Ask a question about your note… (Enter to send, Shift+Enter for new line)" className="min-h-[44px] max-h-40 resize-none" disabled={sending} />
            <Button type="submit" size="icon" variant="gradient" className="h-11 w-11 shrink-0 rounded-xl" disabled={!input.trim() || sending} aria-label="Send"><Send className="h-4 w-4" /></Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground"><MessageSquare className="mr-1 inline h-3 w-3" />Answers are based only on the selected note. Verify important details with your source material.</p>
        </form>
      </div>
      <ConfirmDialog open={confirmClear} onClose={() => setConfirmClear(false)} onConfirm={clearConversation} title="Clear this conversation?" description="All messages in this conversation will be deleted." confirmText="Clear" />
    </div>
  );
}
