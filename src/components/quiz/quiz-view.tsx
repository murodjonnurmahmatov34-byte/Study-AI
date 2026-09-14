"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDuration, timeAgo } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Brain, CheckCircle2, Clock, RotateCcw, Sparkles, Trophy, XCircle, BookOpen, History } from "lucide-react";

type NoteOption = { id: string; title: string; subjectName: string | null; processingStatus: string; wordCount: number };
type Question = { id: string; order: number; type: string; question: string; options: string[] };
type QuizMeta = { id: string; title: string; difficulty: string; questionType: string; noteTitle?: string | null };
type Result = { questionId: string; question: string; options: string[]; answer: string; correctAnswer: string; explanation: string; correct: boolean };
type PastQuiz = { id: string; title: string; difficulty: string; questionType: string; questionCount: number; createdAt: string; noteTitle: string | null; attempts: number; bestScore: number };

export function QuizView({ notes }: { notes: NoteOption[] }) {
  const params = useSearchParams();
  const [noteId, setNoteId] = useState(params.get("noteId") ?? notes[0]?.id ?? "");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [type, setType] = useState<"multiple_choice" | "true_false" | "mixed">("multiple_choice");
  const [generating, setGenerating] = useState(false);
  const [quiz, setQuiz] = useState<QuizMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<{ results: Result[]; score: number; total: number; percentage: number; time: number } | null>(null);
  const [history, setHistory] = useState<PastQuiz[] | null>(null);

  useEffect(() => {
    fetch("/api/quiz").then((r) => r.json()).then((d) => setHistory(d.quizzes ?? [])).catch(() => setHistory([]));
  }, [results]);

  async function generate() {
    if (!noteId) return toast.error("Select a note first");
    setGenerating(true);
    try {
      const res = await fetch("/api/quiz/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ noteId, count, difficulty, type }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuiz(data.quiz);
      setQuestions(data.questions);
      setResults(null);
      toast.success(`Generated ${data.questions.length} questions`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function retake(id: string) {
    setGenerating(true);
    try {
      const res = await fetch(`/api/quiz/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuiz(data.quiz);
      setQuestions(data.questions);
      setResults(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  if (quiz && questions.length && !results) {
    return <QuizRunner quiz={quiz} questions={questions} onExit={() => setQuiz(null)} onDone={(r) => setResults(r)} />;
  }
  if (quiz && results) {
    return <QuizResults quiz={quiz} data={results} onRetake={() => retake(quiz.id)} onNew={() => { setQuiz(null); setResults(null); }} />;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Quizzes" description="Generate AI quizzes from your notes and track your scores." />
      {notes.length === 0 ? (
        <EmptyState icon={BookOpen} title="No notes to quiz on yet" description="Upload or write a note first, then come back to generate a quiz." action={<Button asChild variant="gradient"><Link href="/notes?new=upload">Upload notes</Link></Button>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Quiz settings</CardTitle><CardDescription>Choose a note and customize your quiz.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="note">Study material</Label>
                <Select id="note" value={noteId} onChange={(e) => setNoteId(e.target.value)}>
                  {notes.map((n) => <option key={n.id} value={n.id}>{n.title}{n.subjectName ? ` · ${n.subjectName}` : ""}</option>)}
                </Select>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <Label>Questions</Label>
                  <div className="flex gap-2">{[5, 10, 15].map((n) => <button key={n} onClick={() => setCount(n)} className={cn("flex-1 rounded-xl border py-2 text-sm font-medium transition", count === n ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted")}>{n}</button>)}</div>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <div className="flex gap-2">{(["easy", "medium", "hard"] as const).map((d) => <button key={d} onClick={() => setDifficulty(d)} className={cn("flex-1 rounded-xl border py-2 text-sm font-medium capitalize transition", difficulty === d ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted")}>{d}</button>)}</div>
                </div>
                <div>
                  <Label htmlFor="type">Question type</Label>
                  <Select id="type" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                    <option value="multiple_choice">Multiple choice</option>
                    <option value="true_false">True / False</option>
                    <option value="mixed">Mixed</option>
                  </Select>
                </div>
              </div>
              <Button size="lg" variant="gradient" className="w-full" onClick={generate} loading={generating}>{generating ? "Generating questions…" : <><Brain className="h-4 w-4" /> Generate Quiz</>}</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Recent quizzes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {history === null ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />) : history.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No quizzes yet.</p>
              ) : history.slice(0, 8).map((h) => (
                <button key={h.id} onClick={() => retake(h.id)} className="w-full rounded-xl border p-3 text-left transition hover:bg-muted">
                  <p className="line-clamp-1 text-sm font-medium">{h.noteTitle ?? h.title}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{h.difficulty} · {h.questionCount} Qs · {timeAgo(h.createdAt)}</span>
                    {h.attempts > 0 ? <Badge variant={h.bestScore >= 70 ? "success" : "warning"}>Best {Math.round(h.bestScore)}%</Badge> : <Badge variant="secondary">Not taken</Badge>}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function QuizRunner({ quiz, questions, onExit, onDone }: { quiz: QuizMeta; questions: Question[]; onExit: () => void; onDone: (r: { results: Result[]; score: number; total: number; percentage: number; time: number }) => void }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const start = useMemo(() => Date.now(), []);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [start]);

  const q = questions[idx];
  const answered = Object.keys(answers).length;

  async function submit() {
    if (answered < questions.length && !confirm(`You have ${questions.length - answered} unanswered question(s). Submit anyway?`)) return;
    setSubmitting(true);
    try {
      const time = Math.floor((Date.now() - start) / 1000);
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id, timeTakenSeconds: time, answers: questions.map((qq) => ({ questionId: qq.id, answer: answers[qq.id] ?? "" })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onDone({ results: data.results, score: data.score, total: data.total, percentage: data.percentage, time });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => confirm("Leave this quiz? Progress will be lost.") && onExit()}><ArrowLeft className="h-4 w-4" /> Exit</Button>
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="secondary" className="capitalize">{quiz.difficulty}</Badge>
          <span className="flex items-center gap-1 tabular-nums text-muted-foreground"><Clock className="h-4 w-4" /> {formatDuration(elapsed)}</span>
        </div>
      </div>
      <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Question {idx + 1} of {questions.length}</span><span>{answered} answered</span></div>
      <Progress value={((idx + 1) / questions.length) * 100} className="mb-6" />
      <Card className="p-6 sm:p-8">
        <Badge variant="default" className="mb-4">{q.type === "true_false" ? "True / False" : "Multiple choice"}</Badge>
        <h2 className="text-lg font-semibold leading-relaxed sm:text-xl">{q.question}</h2>
        <div className="mt-6 space-y-3">
          {q.options.map((opt, i) => {
            const selected = answers[q.id] === opt;
            return (
              <button key={i} onClick={() => setAnswers({ ...answers, [q.id]: opt })} className={cn("flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all", selected ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary" : "hover:border-primary/40 hover:bg-muted")}>
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold", selected ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            );
          })}
        </div>
      </Card>
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}><ArrowLeft className="h-4 w-4" /> Previous</Button>
        <div className="hidden gap-1 sm:flex">{questions.map((qq, i) => <button key={qq.id} onClick={() => setIdx(i)} className={cn("h-2.5 w-2.5 rounded-full transition", i === idx ? "bg-primary scale-125" : answers[qq.id] ? "bg-primary/50" : "bg-muted")} aria-label={`Go to question ${i + 1}`} />)}</div>
        {idx < questions.length - 1 ? (
          <Button onClick={() => setIdx(idx + 1)}>Next <ArrowRight className="h-4 w-4" /></Button>
        ) : (
          <Button variant="gradient" onClick={submit} loading={submitting}>Submit quiz <CheckCircle2 className="h-4 w-4" /></Button>
        )}
      </div>
    </div>
  );
}

function QuizResults({ quiz, data, onRetake, onNew }: { quiz: QuizMeta; data: { results: Result[]; score: number; total: number; percentage: number; time: number }; onRetake: () => void; onNew: () => void }) {
  const pct = Math.round(data.percentage);
  const grade = pct >= 90 ? "Outstanding!" : pct >= 70 ? "Great job!" : pct >= 50 ? "Good effort — keep practicing." : "Keep going — review the material and try again.";
  const wrong = data.results.filter((r) => !r.correct).length;
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 p-8 text-center text-white">
          <Trophy className="mx-auto h-10 w-10" />
          <p className="mt-3 text-5xl font-extrabold">{pct}%</p>
          <p className="mt-1 text-white/90">{grade}</p>
          <p className="mt-1 text-sm text-white/70">{quiz.noteTitle ?? quiz.title}</p>
        </div>
        <CardContent className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          <Stat label="Score" value={`${data.score}/${data.total}`} />
          <Stat label="Correct" value={String(data.score)} tone="text-emerald-500" />
          <Stat label="Incorrect" value={String(wrong)} tone="text-red-500" />
          <Stat label="Time taken" value={formatDuration(data.time)} />
        </CardContent>
        <div className="flex flex-wrap justify-center gap-2 border-t p-4">
          <Button variant="outline" onClick={onRetake}><RotateCcw className="h-4 w-4" /> Retake quiz</Button>
          <Button variant="gradient" onClick={onNew}><Brain className="h-4 w-4" /> New quiz</Button>
          <Button asChild variant="ghost"><Link href="/progress">View progress</Link></Button>
        </div>
      </Card>

      <h2 className="text-lg font-semibold">Review answers</h2>
      <div className="space-y-4">
        {data.results.map((r, i) => (
          <Card key={r.questionId} className={cn("p-5 border-l-4", r.correct ? "border-l-emerald-500" : "border-l-red-500")}>
            <div className="flex items-start gap-3">
              {r.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
              <div className="flex-1">
                <p className="font-medium">{i + 1}. {r.question}</p>
                <div className="mt-3 space-y-1.5 text-sm">
                  {r.options.map((o) => (
                    <div key={o} className={cn("rounded-lg border px-3 py-2", o === r.correctAnswer && "border-emerald-500 bg-emerald-500/10", o === r.answer && !r.correct && "border-red-500 bg-red-500/10")}>
                      {o}
                      {o === r.correctAnswer && <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">Correct answer</span>}
                      {o === r.answer && !r.correct && <span className="ml-2 text-xs font-medium text-red-500">Your answer</span>}
                    </div>
                  ))}
                  {!r.answer && <p className="text-xs text-muted-foreground">You didn’t answer this question.</p>}
                </div>
                {r.explanation && <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground"><span className="font-medium text-foreground">Explanation: </span>{r.explanation}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="text-center">
      <p className={cn("text-2xl font-bold", tone)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
