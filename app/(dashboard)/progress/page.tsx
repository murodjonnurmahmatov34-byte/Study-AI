import { requireUser } from "@/lib/auth";
import { getDailyActivity, getDashboardStats, getFlashcardMastery, getQuizHistory, getSubjectPerformance } from "@/lib/progress";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityAreaChart, MasteryPieChart, ScoreLineChart, SubjectBarChart, WeeklyBarChart } from "@/components/dashboard/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/lib/utils";
import { Brain, CheckCircle2, Clock, Flame, Layers, Target } from "lucide-react";

export const metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

function ChartEmpty({ text }: { text: string }) {
  return <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">{text}</div>;
}

export default async function ProgressPage() {
  const user = await requireUser();
  const [stats, weekly, monthly, quizHistory, subjectPerf, mastery] = await Promise.all([
    getDashboardStats(user.id),
    getDailyActivity(user.id, 7),
    getDailyActivity(user.id, 30),
    getQuizHistory(user.id, 12),
    getSubjectPerformance(user.id),
    getFlashcardMastery(user.id),
  ]);
  const accuracy = stats.questionsAnswered ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100) : 0;
  const masteryData = [
    { name: "Known", value: mastery.known, color: "#10b981" },
    { name: "Need practice", value: mastery.practice, color: "#f59e0b" },
    { name: "Not reviewed", value: mastery.unseen, color: "#94a3b8" },
  ].filter((d) => d.value > 0);
  const weekMinutes = weekly.reduce((a, d) => a + d.minutes, 0);

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Progress" description="Detailed analytics of your learning journey." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total study time" value={formatDuration(stats.totalStudySeconds)} icon={Clock} tone="primary" hint={`${weekMinutes} min this week`} />
        <StatCard label="Quizzes taken" value={stats.quizzesCompleted} icon={Brain} tone="pink" hint={`Avg ${stats.averageScore}%`} />
        <StatCard label="Questions answered" value={stats.questionsAnswered} icon={Target} tone="violet" />
        <StatCard label="Accuracy" value={`${accuracy}%`} icon={CheckCircle2} tone="emerald" hint={`${stats.correctAnswers} correct`} />
        <StatCard label="Flashcards reviewed" value={stats.flashcardsReviewed} icon={Layers} tone="sky" />
        <StatCard label="Current streak" value={`${stats.streak} 🔥`} icon={Flame} tone="amber" hint={`Longest: ${stats.longestStreak}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Weekly activity</CardTitle><CardDescription>Sessions and items reviewed per day</CardDescription></CardHeader>
          <CardContent><WeeklyBarChart data={weekly} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Study time — last 30 days</CardTitle><CardDescription>Minutes studied per day</CardDescription></CardHeader>
          <CardContent><ActivityAreaChart data={monthly.map((d) => ({ ...d, label: d.day.slice(5) }))} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quiz scores</CardTitle><CardDescription>Your last {quizHistory.length} quiz attempts</CardDescription></CardHeader>
          <CardContent>{quizHistory.length ? <ScoreLineChart data={quizHistory} /> : <ChartEmpty text="Complete a quiz to see your score trend." />}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Subject performance</CardTitle><CardDescription>Average quiz score by subject</CardDescription></CardHeader>
          <CardContent>{subjectPerf.length ? <SubjectBarChart data={subjectPerf} /> : <ChartEmpty text="Assign notes to subjects and take quizzes to compare." />}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Flashcard mastery</CardTitle><CardDescription>{mastery.total} cards across all notes</CardDescription></CardHeader>
          <CardContent>{masteryData.length ? <MasteryPieChart data={masteryData} /> : <ChartEmpty text="Generate flashcards to track mastery." />}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Accuracy breakdown</CardTitle><CardDescription>Across all quiz questions</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>Overall accuracy</span><span className="font-semibold">{accuracy}%</span></div>
              <Progress value={accuracy} color="bg-emerald-500" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>Flashcards known</span><span className="font-semibold">{mastery.total ? Math.round((mastery.known / mastery.total) * 100) : 0}%</span></div>
              <Progress value={mastery.total ? (mastery.known / mastery.total) * 100 : 0} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>Daily goal today</span><span className="font-semibold">{weekly[weekly.length - 1]?.minutes ?? 0}/{stats.dailyGoalMinutes} min</span></div>
              <Progress value={((weekly[weekly.length - 1]?.minutes ?? 0) / stats.dailyGoalMinutes) * 100} color="bg-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="rounded-xl bg-muted p-3"><p className="text-xl font-bold text-emerald-500">{stats.correctAnswers}</p><p className="text-xs text-muted-foreground">Correct</p></div>
              <div className="rounded-xl bg-muted p-3"><p className="text-xl font-bold text-red-500">{stats.questionsAnswered - stats.correctAnswers}</p><p className="text-xs text-muted-foreground">Incorrect</p></div>
              <div className="rounded-xl bg-muted p-3"><p className="text-xl font-bold">{stats.questionsAnswered}</p><p className="text-xs text-muted-foreground">Total</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
