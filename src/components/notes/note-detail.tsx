"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./notes-view";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Brain, ChevronDown, ChevronUp, Layers, Lightbulb, ListChecks, MessageSquare, RefreshCw, Sparkles, FileText, AlertCircle } from "lucide-react";

type NoteData = {
  id: string; title: string; content: string; summary: string | null; keyPoints: string[] | null;
  keyTerms: { term: string; definition: string }[] | null; processingStatus: string; processingError: string | null;
  sourceType: string; fileName: string | null; wordCount: number; createdAt: string; updatedAt: string;
};

export function NoteDetail({ note: initial, subjectName, subjectColor, flashcardCount, quizCount }: { note: NoteData; subjectName: string | null; subjectColor: string | null; flashcardCount: number; quizCount: number }) {
  const router = useRouter();
  const [note, setNote] = useState(initial);
  const [summarizing, setSummarizing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function summarize() {
    setSummarizing(true);
    setNote((n) => ({ ...n, processingStatus: "processing" }));
    try {
      const res = await fetch(`/api/notes/${note.id}/summarize`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNote({ ...data.note, createdAt: String(data.note.createdAt), updatedAt: String(data.note.updatedAt) });
      toast.success("Summary generated!");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      setNote((n) => ({ ...n, processingStatus: "failed", processingError: (e as Error).message }));
    } finally {
      setSummarizing(false);
    }
  }

  const contentPreview = expanded ? note.content : note.content.slice(0, 1500);
  const isProcessing = note.processingStatus === "processing" || summarizing;

  return (
    <div className="space-y-6 animate-fade-up">
      <Link href="/notes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to notes</Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="uppercase">{note.sourceType}</Badge>
            {subjectName && <Badge variant="outline"><span className="h-2 w-2 rounded-full" style={{ background: subjectColor ?? "#888" }} />{subjectName}</Badge>}
            <StatusBadge status={isProcessing ? "processing" : note.processingStatus} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{note.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{note.wordCount.toLocaleString()} words · Added {formatDate(note.createdAt)}{note.fileName ? ` · ${note.fileName}` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="gradient"><Link href={`/quiz?noteId=${note.id}`}><Brain className="h-4 w-4" /> Generate Quiz</Link></Button>
          <Button asChild variant="outline"><Link href={`/flashcards?noteId=${note.id}`}><Layers className="h-4 w-4" /> {flashcardCount ? `Flashcards (${flashcardCount})` : "Generate Flashcards"}</Link></Button>
          <Button asChild variant="outline"><Link href={`/chat?noteId=${note.id}`}><MessageSquare className="h-4 w-4" /> Ask AI</Link></Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Summary</CardTitle><CardDescription>Generated from your material</CardDescription></div>
              <Button size="sm" variant="outline" onClick={summarize} loading={isProcessing}><RefreshCw className="h-3.5 w-3.5" /> {note.summary ? "Regenerate" : "Generate Summary"}</Button>
            </CardHeader>
            <CardContent>
              {isProcessing ? (
                <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-4/5" /></div>
              ) : note.processingStatus === "failed" ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>AI processing failed: {note.processingError ?? "Unknown error"}. Click regenerate to try again.</span></div>
              ) : note.summary ? (
                <p className="text-sm leading-relaxed">{note.summary}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No summary yet. Click “Generate Summary”.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-emerald-500" /> Key points</CardTitle></CardHeader>
              <CardContent>
                {isProcessing ? <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4" />)}</div> : note.keyPoints?.length ? (
                  <ul className="space-y-2.5">{note.keyPoints.map((p, i) => <li key={i} className="flex gap-2 text-sm"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{i + 1}</span><span>{p}</span></li>)}</ul>
                ) : <p className="text-sm text-muted-foreground">Key points will appear after processing.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /> Important terms</CardTitle></CardHeader>
              <CardContent>
                {isProcessing ? <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4" />)}</div> : note.keyTerms?.length ? (
                  <dl className="space-y-3">{note.keyTerms.map((t, i) => <div key={i}><dt className="text-sm font-semibold">{t.term}</dt><dd className="text-sm text-muted-foreground">{t.definition}</dd></div>)}</dl>
                ) : <p className="text-sm text-muted-foreground">Important terms will appear after processing.</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Original content</CardTitle></CardHeader>
            <CardContent>
              <div className="prose-note whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{contentPreview}{!expanded && note.content.length > 1500 && "…"}</div>
              {note.content.length > 1500 && (
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => setExpanded(!expanded)}>{expanded ? <><ChevronUp className="h-4 w-4" /> Show less</> : <><ChevronDown className="h-4 w-4" /> Show full content</>}</Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold">Study tools</h3>
            <p className="mt-1 text-xs text-muted-foreground">Everything generated from this note.</p>
            <div className="mt-4 space-y-2">
              <Link href={`/quiz?noteId=${note.id}`} className="flex items-center justify-between rounded-xl border p-3 text-sm transition hover:bg-muted"><span className="flex items-center gap-2"><Brain className="h-4 w-4 text-pink-500" /> Quizzes</span><Badge variant="secondary">{quizCount}</Badge></Link>
              <Link href={`/flashcards?noteId=${note.id}`} className="flex items-center justify-between rounded-xl border p-3 text-sm transition hover:bg-muted"><span className="flex items-center gap-2"><Layers className="h-4 w-4 text-violet-500" /> Flashcards</span><Badge variant="secondary">{flashcardCount}</Badge></Link>
              <Link href={`/chat?noteId=${note.id}`} className="flex items-center justify-between rounded-xl border p-3 text-sm transition hover:bg-muted"><span className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-sky-500" /> Ask a question</span></Link>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold">Suggested next step</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {!note.summary ? "Generate a summary to extract key points and terms." : quizCount === 0 ? "Test yourself with a quick 5-question quiz to check your understanding." : flashcardCount === 0 ? "Create flashcards to memorize the important terms." : "Ask the AI to explain anything you found confusing."}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
