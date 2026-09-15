import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDailyActivity, getDashboardStats, getRecentActivity } from "@/lib/progress";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityAreaChart } from "@/components/dashboard/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDuration, timeAgo } from "@/lib/utils";
import { BookOpen, Brain, Flame, Layers, MessageSquare, Target, Upload, Activity, TrendingUp } from "lucide-react";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const ACTIVITY_META: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  quiz: { label: "Completed a quiz", icon: Brain, color: "text-pink-500 bg-pink-500/10" },
  flashcards: { label: "Reviewed flashcards", icon: Layers, color: "text-violet-500 bg-violet-500/10" },
  chat: { label: "Asked AI a question", icon: MessageSquare, color: "text-sky-500 bg-sky-500/10" },
  reading: { label: "Studied a summary", icon: BookOpen, color: "text-emerald-500 bg-emerald-500/10" },
  upload: { label: "Added study material", icon: Upload, color: "text-amber-500 bg-amber-500/10" },
};

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, activity, daily] = await Promise.all([getDashboardStats(user.id), getRecentActivity(user.id), getDailyActivity(user.id, 7)]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const todayMinutes = daily[daily.length - 1]?.minutes ?? 0;
  const goalPct = Math.min(100, Math.round((todayMinutes / stats.dailyGoalMinutes) * 100));

  const quickActions = [
    { href: "/notes?new=upload", label: "Upload Notes", icon: Upload, desc: "PDF, DOCX or TXT", color: "from-indigo-500 to-violet-500" },
    { href: "/quiz", label: "Generate Quiz", icon: Brain, desc: "Test your knowledge", color: "from-pink-500 to-rose-500" },
    { href: "/flashcards", label: "Create Flashcards", icon: Layers, desc: "Memorize key terms", color: "from-violet-500 to-purple-500" },
    { href: "/chat", label: "Ask AI", icon: MessageSquare, desc: "Chat with your notes", color: "from-sky-500 to-cyan-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting}, {user.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.streak > 0 ? `You're on a ${stats.streak}-day streak. Keep it going!` : "Start a study session today to begin a new streak."}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-sm shadow-sm">
          <Target className="h-5 w-5 text-primary" />
          <div className="w-40">
            <div className="flex justify-between text-xs"><span>Daily goal</span><span className="font-medium">{todayMinutes}/{stats.dailyGoalMinutes} min</span></div>
            <div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${goalPct}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Study materials" value={stats.totalNotes} icon={BookOpen} tone="primary" />
        <StatCard label="Quizzes completed" value={stats.quizzesCompleted} icon={Brain} tone="pink" />
        <StatCard label="Flashcards reviewed" value={stats.flashcardsReviewed} icon={Layers} tone="violet" />
        <StatCard label="Study streak" value={`${stats.streak} 🔥`} icon={Flame} hint={`Best: ${stats.longestStreak} days`} tone="amber" />
        <StatCard label="Average quiz score" value={`${stats.averageScore}%`} icon={TrendingUp} tone="emerald" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map(({ href, label, icon: Icon, desc, color }) => (
          <Link key={href} href={href} className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${color} p-2.5 text-white shadow-md transition-transform group-hover:scale-110`}><Icon className="h-5 w-5" /></div>
            <p className="font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Study activity</CardTitle><CardDescription>Minutes studied over the last 7 days</CardDescription></CardHeader>
          <CardContent>
            <ActivityAreaChart data={daily} />
            <p className="mt-2 text-xs text-muted-foreground">Total time studied: {formatDuration(stats.totalStudySeconds)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>Your latest study sessions</CardDescription></CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Activity className="mx-auto mb-2 h-8 w-8 opacity-40" />
                No activity yet. Upload a note to get started!
                <div className="mt-4"><Button asChild size="sm"><Link href="/notes?new=upload">Upload notes</Link></Button></div>
              </div>
            ) : (
              <ul className="space-y-3">
                {activity.map((a) => {
                  const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.reading;
                  const Icon = meta.icon;
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <div className={`rounded-lg p-2 ${meta.color}`}><Icon className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{meta.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.noteTitle ?? "—"} · {timeAgo(a.createdAt)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
