import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { flashcardProgress, notes, quizAttempts, studySessions, userProgress, flashcards, subjects, quizzes } from "@/db/schema";
import { todayKey } from "./utils";

/** Records a study activity and updates streak + aggregate counters. */
export async function recordActivity(
  userId: string,
  data: {
    type: "quiz" | "flashcards" | "chat" | "reading" | "upload";
    durationSeconds?: number;
    itemsCount?: number;
    noteId?: string | null;
    questionsAnswered?: number;
    correctAnswers?: number;
    flashcardsReviewed?: number;
  },
) {
  await db.insert(studySessions).values({
    userId,
    type: data.type,
    durationSeconds: data.durationSeconds ?? 0,
    itemsCount: data.itemsCount ?? 0,
    noteId: data.noteId ?? null,
  });

  const [existing] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  const today = todayKey();
  const yesterday = todayKey(new Date(Date.now() - 86400000));
  let currentStreak = existing?.currentStreak ?? 0;
  if (existing?.lastActiveDate !== today) {
    currentStreak = existing?.lastActiveDate === yesterday ? currentStreak + 1 : 1;
  }
  const longestStreak = Math.max(existing?.longestStreak ?? 0, currentStreak);

  await db
    .insert(userProgress)
    .values({
      userId,
      currentStreak,
      longestStreak,
      lastActiveDate: today,
      totalStudySeconds: data.durationSeconds ?? 0,
      totalQuestionsAnswered: data.questionsAnswered ?? 0,
      totalCorrectAnswers: data.correctAnswers ?? 0,
      totalFlashcardsReviewed: data.flashcardsReviewed ?? 0,
    })
    .onConflictDoUpdate({
      target: userProgress.userId,
      set: {
        currentStreak,
        longestStreak,
        lastActiveDate: today,
        totalStudySeconds: sql`${userProgress.totalStudySeconds} + ${data.durationSeconds ?? 0}`,
        totalQuestionsAnswered: sql`${userProgress.totalQuestionsAnswered} + ${data.questionsAnswered ?? 0}`,
        totalCorrectAnswers: sql`${userProgress.totalCorrectAnswers} + ${data.correctAnswers ?? 0}`,
        totalFlashcardsReviewed: sql`${userProgress.totalFlashcardsReviewed} + ${data.flashcardsReviewed ?? 0}`,
        updatedAt: new Date(),
      },
    });
}

export async function getDashboardStats(userId: string) {
  const [[noteCount], [quizCount], [fcReviewed], [prog], [avg]] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(notes).where(eq(notes.userId, userId)),
    db.select({ c: sql<number>`count(*)::int` }).from(quizAttempts).where(eq(quizAttempts.userId, userId)),
    db
      .select({ c: sql<number>`coalesce(sum(${flashcardProgress.reviewCount}),0)::int` })
      .from(flashcardProgress)
      .where(eq(flashcardProgress.userId, userId)),
    db.select().from(userProgress).where(eq(userProgress.userId, userId)),
    db
      .select({ a: sql<number>`coalesce(avg(${quizAttempts.percentage}),0)::float` })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId)),
  ]);

  // Streak resets if the user missed yesterday and today
  const today = todayKey();
  const yesterday = todayKey(new Date(Date.now() - 86400000));
  const streak = prog && (prog.lastActiveDate === today || prog.lastActiveDate === yesterday) ? prog.currentStreak : 0;

  return {
    totalNotes: noteCount?.c ?? 0,
    quizzesCompleted: quizCount?.c ?? 0,
    flashcardsReviewed: fcReviewed?.c ?? 0,
    streak,
    longestStreak: prog?.longestStreak ?? 0,
    averageScore: Math.round(avg?.a ?? 0),
    totalStudySeconds: prog?.totalStudySeconds ?? 0,
    questionsAnswered: prog?.totalQuestionsAnswered ?? 0,
    correctAnswers: prog?.totalCorrectAnswers ?? 0,
    dailyGoalMinutes: prog?.dailyGoalMinutes ?? 30,
  };
}

export async function getRecentActivity(userId: string, limit = 8) {
  return db
    .select({
      id: studySessions.id,
      type: studySessions.type,
      durationSeconds: studySessions.durationSeconds,
      itemsCount: studySessions.itemsCount,
      createdAt: studySessions.createdAt,
      noteTitle: notes.title,
    })
    .from(studySessions)
    .leftJoin(notes, eq(studySessions.noteId, notes.id))
    .where(eq(studySessions.userId, userId))
    .orderBy(desc(studySessions.createdAt))
    .limit(limit);
}

/** Last N days of activity aggregated per day. */
export async function getDailyActivity(userId: string, days = 7) {
  const since = new Date(Date.now() - (days - 1) * 86400000);
  since.setHours(0, 0, 0, 0);
  const rows = await db
    .select({
      day: sql<string>`to_char(${studySessions.createdAt}, 'YYYY-MM-DD')`,
      seconds: sql<number>`coalesce(sum(${studySessions.durationSeconds}),0)::int`,
      sessions: sql<number>`count(*)::int`,
      items: sql<number>`coalesce(sum(${studySessions.itemsCount}),0)::int`,
    })
    .from(studySessions)
    .where(and(eq(studySessions.userId, userId), gte(studySessions.createdAt, since)))
    .groupBy(sql`1`);
  const map = new Map(rows.map((r) => [r.day, r]));
  const out: { day: string; label: string; minutes: number; sessions: number; items: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400000);
    const key = todayKey(d);
    const r = map.get(key);
    out.push({
      day: key,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      minutes: Math.round((r?.seconds ?? 0) / 60),
      sessions: r?.sessions ?? 0,
      items: r?.items ?? 0,
    });
  }
  return out;
}

export async function getQuizHistory(userId: string, limit = 10) {
  const rows = await db
    .select({
      id: quizAttempts.id,
      percentage: quizAttempts.percentage,
      score: quizAttempts.score,
      total: quizAttempts.total,
      completedAt: quizAttempts.completedAt,
      timeTakenSeconds: quizAttempts.timeTakenSeconds,
      title: quizzes.title,
    })
    .from(quizAttempts)
    .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
    .where(eq(quizAttempts.userId, userId))
    .orderBy(desc(quizAttempts.completedAt))
    .limit(limit);
  return rows.reverse();
}

export async function getSubjectPerformance(userId: string) {
  return db
    .select({
      subject: sql<string>`coalesce(${subjects.name}, 'Uncategorized')`,
      color: sql<string>`coalesce(${subjects.color}, '#94a3b8')`,
      attempts: sql<number>`count(${quizAttempts.id})::int`,
      avg: sql<number>`coalesce(avg(${quizAttempts.percentage}),0)::float`,
    })
    .from(quizAttempts)
    .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
    .leftJoin(notes, eq(quizzes.noteId, notes.id))
    .leftJoin(subjects, eq(notes.subjectId, subjects.id))
    .where(eq(quizAttempts.userId, userId))
    .groupBy(subjects.name, subjects.color);
}

export async function getFlashcardMastery(userId: string) {
  const [row] = await db
    .select({
      total: sql<number>`count(${flashcards.id})::int`,
      known: sql<number>`count(*) filter (where ${flashcardProgress.status} = 'known')::int`,
      practice: sql<number>`count(*) filter (where ${flashcardProgress.status} = 'practice')::int`,
    })
    .from(flashcards)
    .leftJoin(
      flashcardProgress,
      and(eq(flashcardProgress.flashcardId, flashcards.id), eq(flashcardProgress.userId, userId)),
    )
    .where(eq(flashcards.userId, userId));
  const total = row?.total ?? 0;
  const known = row?.known ?? 0;
  const practice = row?.practice ?? 0;
  return { total, known, practice, unseen: Math.max(0, total - known - practice) };
}
