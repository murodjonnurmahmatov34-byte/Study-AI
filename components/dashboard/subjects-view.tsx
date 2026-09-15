"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, SUBJECT_COLORS } from "@/lib/utils";
import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";

type Subject = { id: string; name: string; color: string; noteCount: number };

export function SubjectsView({ initial }: { initial: Subject[] }) {
  const [subjects, setSubjects] = useState(initial);
  const [editing, setEditing] = useState<Subject | "new" | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/subjects");
    if (res.ok) setSubjects((await res.json()).subjects);
  }
  function openEdit(s: Subject | "new") { setEditing(s); setColor(s === "new" ? SUBJECT_COLORS[0] : s.color); }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name") || "").trim();
    if (!name) return toast.error("Name is required");
    setBusy(true);
    try {
      const isNew = editing === "new";
      const res = await fetch(isNew ? "/api/subjects" : `/api/subjects/${(editing as Subject).id}`, { method: isNew ? "POST" : "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, color }) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(isNew ? "Subject created" : "Subject updated");
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    const res = await fetch(`/api/subjects/${deleting.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return toast.error("Failed to delete subject");
    toast.success("Subject deleted");
    setDeleting(null);
    refresh();
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Subjects" description="Organize your notes by course or topic." actions={<Button variant="gradient" onClick={() => openEdit("new")}><Plus className="h-4 w-4" /> New subject</Button>} />
      {subjects.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No subjects yet" description="Create subjects like “Biology” or “History” to group your notes and compare performance." action={<Button variant="gradient" onClick={() => openEdit("new")}><Plus className="h-4 w-4" /> Create subject</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subjects.map((s) => (
            <Card key={s.id} className="group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: s.color }} />
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md" style={{ background: s.color }}><FolderOpen className="h-5 w-5" /></div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleting(s)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <Link href={`/notes?subjectId=${s.id}`}>
                <h3 className="mt-4 font-semibold group-hover:text-primary">{s.name}</h3>
                <p className="text-sm text-muted-foreground">{s.noteCount} note{s.noteCount === 1 ? "" : "s"}</p>
              </Link>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "New subject" : "Edit subject"} className="max-w-md">
        <form onSubmit={save} className="space-y-4">
          <div><Label htmlFor="sn">Name</Label><Input id="sn" name="name" defaultValue={editing && editing !== "new" ? editing.name : ""} placeholder="e.g. Organic Chemistry" maxLength={50} required /></div>
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">{SUBJECT_COLORS.map((c) => <button type="button" key={c} onClick={() => setColor(c)} className={cn("h-8 w-8 rounded-full transition", color === c && "ring-2 ring-offset-2 ring-primary ring-offset-card")} style={{ background: c }} aria-label={c} />)}</div>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={busy}>Save</Button></div>
        </form>
      </Dialog>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} title={`Delete “${deleting?.name}”?`} description="Notes in this subject will be kept but become uncategorized." />
    </div>
  );
}
