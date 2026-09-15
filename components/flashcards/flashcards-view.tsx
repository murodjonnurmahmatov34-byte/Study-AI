"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, shuffle as shuffleArr } from "@/lib/utils";
import { ArrowLeft, ArrowRight, BookOpen, Check, Layers, RotateCcw, Shuffle, Sparkles, X, Target, RefreshCw } from "lucide-react";

type NoteOption = { id: string; title: string; subjectName: string | null };
type Card = { id: string; front: string; back: string; status: "new" | "known" | "practice"; reviewCount: number };

export function FlashcardsView({ notes }: { notes: NoteOption[] }) {
  const params = useSearchParams();
  const [noteId, setNoteId] = useState(params.get("noteId") ?? notes[0]?.id ?? "");
  const [cards, setCards] = useState<Card[] | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"all" | "review">("all");
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(10);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!noteId) return setCards([]);
    setCards(null);
    const res = await fetch(`/api/flashcards?noteId=${noteId}`);
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return setCards([]); }
    setCards(data.flashcards);
    setOrder(data.flashcards.map((c: Card) => c.id));
    setIdx(0);
    setFlipped(false);
  }, [noteId]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    if (!cards) return [];
    const map = new Map(cards.map((c) => [c.id, c]));
    return order.map((id) => map.get(id)!).filter((c) => c && (mode === "all" || c.status !== "known"));
  }, [cards, order, mode]);

  const current = visible[idx];
  const known = cards?.filter((c) => c.status === "known").length ?? 0;
  const practice = cards?.filter((c) => c.status === "practice").length ?? 0;

  async function generate(replace = false) {
    setGenerating(true);
    try {
      const res = await fetch("/api/flashcards/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ noteId, count, replace }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Generated ${data.flashcards.length} flashcards`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function mark(status: "known" | "practice") {
    if (!current || saving) return;
    setSaving(true);
    const prev = cards!;
    setCards(prev.map((c) => (c.id === current.id ? { ...c, status, reviewCount: c.reviewCount + 1 } : c)));
    try {
      const res = await fetch("/api/flashcards/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ flashcardId: current.id, status }) });
      if (!res.ok) throw new Error((await res.json()).error);
      setFlipped(false);
      // in review mode a known card disappears from the list so keep the same index
      setTimeout(() => setIdx((i) => (mode === "review" && status === "known" ? Math.min(i, visible.length - 2) : Math.min(i + 1, visible.length - 1))), 150);
    } catch (e) {
      setCards(prev);
      toast.error((e as Error).message || "Failed to save progress");
    } finally {
      setSaving(false);
    }
  }

  function doShuffle() {
    setOrder(shuffleArr(order));
    setIdx(0);
    setFlipped(false);
    toast.success("Deck shuffled");
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!current) return;
      if (e.key === " ") { e.preventDefault(); setFlipped((f) => !f); }
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, visible.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [current, visible.length]);

  useEffect(() => { if (idx > visible.length - 1) setIdx(Math.max(0, visible.length - 1)); }, [visible.length, idx]);

  if (notes.length === 0) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Flashcards" description="Memorize key terms with AI-generated flashcards." />
        <EmptyState icon={BookOpen} title="No notes yet" description="Upload a note first, then generate flashcards from it." action={<Button asChild variant="gradient"><Link href="/notes?new=upload">Upload notes</Link></Button>} />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Flashcards"
        description="Flip, review, and mark what you know. Progress is saved automatically."
        actions={
          <div className="flex items-center gap-2">
            <Select value={noteId} onChange={(e) => setNoteId(e.target.value)} className="w-56">
              {notes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
            </Select>
          </div>
        }
      />

      {cards === null ? (
        <div className="mx-auto max-w-2xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-72" /><Skeleton className="h-12" /></div>
      ) : cards.length === 0 ? (
        <Card className="mx-auto max-w-xl p-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-primary/10 p-4 text-primary"><Layers className="h-8 w-8" /></div>
          <h3 className="text-lg font-semibold">No flashcards for this note yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Let AI create a deck of flashcards from the key concepts in your note.</p>
          <div className="mx-auto mt-5 flex max-w-xs items-end gap-2">
            <div className="flex-1 text-left"><Label htmlFor="cnt">Cards</Label><Select id="cnt" value={count} onChange={(e) => setCount(Number(e.target.value))}>{[6, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}</Select></div>
            <Button variant="gradient" onClick={() => generate()} loading={generating}>{generating ? "Generating…" : <><Sparkles className="h-4 w-4" /> Generate</>}</Button>
          </div>
        </Card>
      ) : (
        <div className="mx-auto max-w-2xl">
          {/* Stats & modes */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 text-xs">
              <Badge variant="success"><Check className="h-3 w-3" /> {known} known</Badge>
              <Badge variant="warning"><Target className="h-3 w-3" /> {practice} need practice</Badge>
              <Badge variant="secondary">{cards.length - known - practice} new</Badge>
            </div>
            <div className="flex gap-1 rounded-xl border p-1 text-xs">
              <button onClick={() => { setMode("all"); setIdx(0); }} className={cn("rounded-lg px-3 py-1.5 font-medium transition", mode === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>All cards</button>
              <button onClick={() => { setMode("review"); setIdx(0); }} className={cn("rounded-lg px-3 py-1.5 font-medium transition", mode === "review" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>Review mode</button>
            </div>
          </div>
          <Progress value={cards.length ? (known / cards.length) * 100 : 0} color="bg-emerald-500" className="mb-6" />

          {visible.length === 0 ? (
            <Card className="p-10 text-center">
              <div className="mx-auto mb-3 inline-flex rounded-2xl bg-emerald-500/10 p-4 text-emerald-500"><Check className="h-8 w-8" /></div>
              <h3 className="text-lg font-semibold">You’ve mastered every card! 🎉</h3>
              <p className="mt-1 text-sm text-muted-foreground">Switch to “All cards” to review again or generate a fresh deck.</p>
              <div className="mt-4 flex justify-center gap-2"><Button variant="outline" onClick={() => setMode("all")}>Review all</Button><Button variant="gradient" onClick={() => generate(true)} loading={generating}><RefreshCw className="h-4 w-4" /> Regenerate deck</Button></div>
            </Card>
          ) : current ? (
            <>
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Card {idx + 1} of {visible.length}</span>
                <span>Space to flip · ← → to navigate</span>
              </div>
              <div className="perspective h-72 sm:h-80" onClick={() => setFlipped(!flipped)} role="button" tabIndex={0} aria-label="Flip card">
                <div className={cn("preserve-3d relative h-full w-full cursor-pointer transition-transform duration-500", flipped && "rotate-y-180")}>
                  <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-3xl border bg-card p-8 text-center shadow-lg">
                    <Badge variant="secondary" className="absolute left-4 top-4">Front</Badge>
                    {current.status !== "new" && <Badge variant={current.status === "known" ? "success" : "warning"} className="absolute right-4 top-4 capitalize">{current.status === "known" ? "Known" : "Practice"}</Badge>}
                    <p className="text-lg font-semibold leading-relaxed sm:text-xl">{current.front}</p>
                    <p className="absolute bottom-4 text-xs text-muted-foreground">Click to reveal answer</p>
                  </div>
                  <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-8 text-center shadow-lg">
                    <Badge className="absolute left-4 top-4">Back</Badge>
                    <p className="text-base leading-relaxed sm:text-lg">{current.back}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button size="lg" variant="outline" className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400" onClick={() => mark("practice")} disabled={saving}><X className="h-4 w-4" /> Need practice</Button>
                <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => mark("known")} disabled={saving}><Check className="h-4 w-4" /> I know this</Button>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => { setIdx(idx - 1); setFlipped(false); }}><ArrowLeft className="h-4 w-4" /> Prev</Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={doShuffle}><Shuffle className="h-4 w-4" /> Shuffle</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setIdx(0); setFlipped(false); }}><RotateCcw className="h-4 w-4" /> Restart</Button>
                  <Button variant="ghost" size="sm" onClick={() => generate(true)} loading={generating}><RefreshCw className="h-4 w-4" /> New deck</Button>
                </div>
                <Button variant="ghost" size="sm" disabled={idx >= visible.length - 1} onClick={() => { setIdx(idx + 1); setFlipped(false); }}>Next <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
