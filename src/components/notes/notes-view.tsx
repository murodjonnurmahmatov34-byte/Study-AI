"use client";
import { useCallback, useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { timeAgo } from "@/lib/utils";
import { BookOpen, CheckCircle2, FileText, Loader2, MoreHorizontal, Pencil, PenLine, Search, Trash2, Upload, XCircle, AlertCircle } from "lucide-react";

export type NoteListItem = {
  id: string;
  title: string;
  subjectId: string | null;
  subjectName: string | null;
  subjectColor: string | null;
  sourceType: string;
  wordCount: number;
  processingStatus: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};
export type SubjectItem = { id: string; name: string; color: string; noteCount?: number };

export function StatusBadge({ status }: { status: string }) {
  if (status === "ready") return <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Ready</Badge>;
  if (status === "processing") return <Badge variant="warning"><Loader2 className="h-3 w-3 animate-spin" /> Processing</Badge>;
  if (status === "failed") return <Badge variant="danger"><XCircle className="h-3 w-3" /> Failed</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

export function NotesView({ subjects }: { subjects: SubjectItem[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [notes, setNotes] = useState<NoteListItem[] | null>(null);
  const [q, setQ] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState<"upload" | "create" | null>(params.get("new") === "upload" ? "upload" : params.get("new") === "create" ? "create" : null);
  const [renaming, setRenaming] = useState<NoteListItem | null>(null);
  const [deleting, setDeleting] = useState<NoteListItem | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sp = new URLSearchParams({ page: String(page), limit: "12" });
    if (q) sp.set("q", q);
    if (subjectId) sp.set("subjectId", subjectId);
    const res = await fetch(`/api/notes?${sp}`);
    if (!res.ok) return toast.error("Failed to load notes");
    const data = await res.json();
    setNotes(data.notes);
    setPages(data.pages);
    setTotal(data.total);
  }, [page, q, subjectId]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function rename(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!renaming) return;
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const res = await fetch(`/api/notes/${renaming.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: fd.get("title"), subjectId: fd.get("subjectId") || null }) });
    setBusy(false);
    if (!res.ok) return toast.error((await res.json()).error);
    toast.success("Note updated");
    setRenaming(null);
    load();
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    const res = await fetch(`/api/notes/${deleting.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return toast.error("Failed to delete note");
    toast.success("Note deleted");
    setDeleting(null);
    load();
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Notes"
        description={`${total} study material${total === 1 ? "" : "s"} in your library`}
        actions={
          <>
            <Button variant="outline" onClick={() => setModal("create")}><PenLine className="h-4 w-4" /> Write note</Button>
            <Button variant="gradient" onClick={() => setModal("upload")}><Upload className="h-4 w-4" /> Upload</Button>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search notes by title or content…" className="pl-9" />
        </div>
        <Select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setPage(1); }} className="sm:w-56">
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      {notes === null ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={q || subjectId ? "No notes match your filters" : "No study materials yet"}
          description={q || subjectId ? "Try a different search term or subject." : "Upload a PDF, DOCX or TXT file — or write a note — and StudyAI will summarize it for you."}
          action={!q && !subjectId && <Button variant="gradient" onClick={() => setModal("upload")}><Upload className="h-4 w-4" /> Upload your first note</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {notes.map((n) => (
              <Card key={n.id} className="group relative flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary"><FileText className="h-4 w-4" /></div>
                    <Badge variant="secondary" className="uppercase">{n.sourceType}</Badge>
                  </div>
                  <NoteMenu onRename={() => setRenaming(n)} onDelete={() => setDeleting(n)} />
                </div>
                <Link href={`/notes/${n.id}`} className="flex-1">
                  <h3 className="line-clamp-1 font-semibold group-hover:text-primary">{n.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.summary ?? "Summary will appear here once processed."}</p>
                </Link>
                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {n.subjectName && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: n.subjectColor ?? "#888" }} />{n.subjectName}</span>}
                    <span>{n.wordCount.toLocaleString()} words</span>
                  </div>
                  <StatusBadge status={n.processingStatus} />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">Updated {timeAgo(n.updatedAt)}</p>
              </Card>
            ))}
          </div>
          {pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      <UploadDialog open={modal === "upload"} onClose={() => setModal(null)} subjects={subjects} onDone={(id) => { setModal(null); router.push(`/notes/${id}`); }} />
      <CreateNoteDialog open={modal === "create"} onClose={() => setModal(null)} subjects={subjects} onDone={(id) => { setModal(null); router.push(`/notes/${id}`); }} />

      <Dialog open={!!renaming} onClose={() => setRenaming(null)} title="Edit note">
        {renaming && (
          <form onSubmit={rename} className="space-y-4">
            <div><Label htmlFor="rt">Title</Label><Input id="rt" name="title" defaultValue={renaming.title} required maxLength={200} /></div>
            <div>
              <Label htmlFor="rs">Subject</Label>
              <Select id="rs" name="subjectId" defaultValue={renaming.subjectId ?? ""}>
                <option value="">No subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setRenaming(null)}>Cancel</Button><Button type="submit" loading={busy}>Save</Button></div>
          </form>
        )}
      </Dialog>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} title="Delete this note?" description={`"${deleting?.title}" and all of its quizzes, flashcards and chats will be permanently removed.`} />
    </div>
  );
}

function NoteMenu({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Note actions"><MoreHorizontal className="h-4 w-4" /></button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-40 rounded-xl border bg-card p-1 shadow-lg">
          <button onClick={() => { setOpen(false); onRename(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"><Pencil className="h-4 w-4" /> Rename</button>
          <button onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      )}
    </div>
  );
}

const ACCEPT = ".pdf,.txt,.md,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function UploadDialog({ open, onClose, subjects, onDone }: { open: boolean; onClose: () => void; subjects: SubjectItem[]; onDone: (id: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [drag, setDrag] = useState(false);
  const [stage, setStage] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [pct, setPct] = useState(0);
  const [error, setError] = useState("");

  function pick(f: File | null) {
    if (!f) return;
    const ok = /\.(pdf|txt|md|docx)$/i.test(f.name);
    if (!ok) return toast.error("Unsupported file type. Use PDF, DOCX, TXT or MD.");
    if (f.size > 10 * 1024 * 1024) return toast.error("File is too large (max 10 MB).");
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    pick(e.dataTransfer.files?.[0] ?? null);
  }
  function reset() { setFile(null); setTitle(""); setSubjectId(""); setStage("idle"); setPct(0); setError(""); }

  function submit() {
    if (!file) return;
    setStage("uploading");
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);
    if (subjectId) fd.append("subjectId", subjectId);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/notes/upload");
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const p = Math.round((ev.loaded / ev.total) * 100);
        setPct(p);
        if (p >= 100) setStage("processing");
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 400) throw new Error(data.error || "Upload failed");
        setStage("done");
        toast.success(data.note.processingStatus === "ready" ? "Note uploaded & summarized!" : "Note uploaded");
        setTimeout(() => { onDone(data.note.id); reset(); }, 600);
      } catch (e) {
        setStage("error");
        setError((e as Error).message);
      }
    };
    xhr.onerror = () => { setStage("error"); setError("Network error. Please try again."); };
    xhr.send(fd);
  }

  const working = stage === "uploading" || stage === "processing";
  return (
    <Dialog open={open} onClose={() => { if (!working) { onClose(); reset(); } }} title="Upload study material" description="PDF, DOCX, TXT or Markdown · up to 10 MB">
      <div className="space-y-4">
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${drag ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
        >
          <input type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} disabled={working} />
          <div className="mb-3 rounded-xl bg-primary/10 p-3 text-primary"><Upload className="h-6 w-6" /></div>
          {file ? (
            <><p className="text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · click to change</p></>
          ) : (
            <><p className="text-sm font-medium">Drag & drop or click to browse</p><p className="text-xs text-muted-foreground">We’ll extract the text and generate a summary</p></>
          )}
        </label>
        <div><Label htmlFor="ut">Title</Label><Input id="ut" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Biology — Chapter 4" disabled={working} /></div>
        <div>
          <Label htmlFor="us">Subject (optional)</Label>
          <Select id="us" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={working}>
            <option value="">No subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        {stage !== "idle" && (
          <div className="rounded-xl border bg-muted/40 p-3 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                {stage === "uploading" && <><Loader2 className="h-4 w-4 animate-spin" /> Uploading… {pct}%</>}
                {stage === "processing" && <><Loader2 className="h-4 w-4 animate-spin text-primary" /> Extracting text & generating AI summary…</>}
                {stage === "done" && <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Done!</>}
                {stage === "error" && <><AlertCircle className="h-4 w-4 text-red-500" /> {error}</>}
              </span>
            </div>
            <Progress value={stage === "uploading" ? pct : 100} className={stage === "processing" ? "animate-pulse" : ""} color={stage === "error" ? "bg-red-500" : stage === "done" ? "bg-emerald-500" : undefined} />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { onClose(); reset(); }} disabled={working}>Cancel</Button>
          <Button variant="gradient" onClick={submit} disabled={!file || working} loading={working}>{stage === "error" ? "Retry" : "Upload & Process"}</Button>
        </div>
      </div>
    </Dialog>
  );
}

export function CreateNoteDialog({ open, onClose, subjects, onDone }: { open: boolean; onClose: () => void; subjects: SubjectItem[]; onDone: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const content = String(fd.get("content") || "");
    if (content.trim().length < 20) return toast.error("Please write at least 20 characters.");
    setLoading(true);
    try {
      const res = await fetch("/api/notes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: fd.get("title"), content, subjectId: fd.get("subjectId") || null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Note created & summarized!");
      onDone(data.note.id);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog open={open} onClose={onClose} title="Write a note" description="Paste or type your study material. AI will summarize it automatically." className="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="ct">Title</Label><Input id="ct" name="title" required maxLength={200} placeholder="e.g. French Revolution — causes" /></div>
          <div>
            <Label htmlFor="cs">Subject</Label>
            <Select id="cs" name="subjectId"><option value="">No subject</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          </div>
        </div>
        <div><Label htmlFor="cc">Content</Label><Textarea id="cc" name="content" required className="min-h-[220px]" placeholder="Paste your lecture notes, textbook excerpt, or anything you want to study…" /></div>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" variant="gradient" loading={loading}>{loading ? "Summarizing…" : "Create & Summarize"}</Button></div>
      </form>
    </Dialog>
  );
}
