import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  real,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

const id = () =>
  text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`);

export const users = pgTable(
  "users",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    image: text("image"),
    provider: text("provider").notNull().default("credentials"),
    googleId: text("google_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), index("users_google_idx").on(t.googleId)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_idx").on(t.tokenHash), index("sessions_user_idx").on(t.userId)],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("prt_token_idx").on(t.tokenHash)],
);

export const subjects = pgTable(
  "subjects",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#6366f1"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("subjects_user_idx").on(t.userId)],
);

export const notes = pgTable(
  "notes",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    sourceType: text("source_type").notNull().default("manual"), // manual | pdf | txt | docx
    fileName: text("file_name"),
    wordCount: integer("word_count").notNull().default(0),
    summary: text("summary"),
    keyPoints: jsonb("key_points").$type<string[]>(),
    keyTerms: jsonb("key_terms").$type<{ term: string; definition: string }[]>(),
    processingStatus: text("processing_status").notNull().default("pending"), // pending | processing | ready | failed
    processingError: text("processing_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("notes_user_idx").on(t.userId),
    index("notes_subject_idx").on(t.subjectId),
    index("notes_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export const quizzes = pgTable(
  "quizzes",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    noteId: text("note_id").references(() => notes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    difficulty: text("difficulty").notNull().default("medium"),
    questionType: text("question_type").notNull().default("multiple_choice"),
    questionCount: integer("question_count").notNull().default(5),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("quizzes_user_idx").on(t.userId), index("quizzes_note_idx").on(t.noteId)],
);

export const questions = pgTable(
  "questions",
  {
    id: id(),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    order: integer("order").notNull().default(0),
    type: text("type").notNull().default("multiple_choice"),
    question: text("question").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    correctAnswer: text("correct_answer").notNull(),
    explanation: text("explanation").notNull().default(""),
  },
  (t) => [index("questions_quiz_idx").on(t.quizId)],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    percentage: real("percentage").notNull(),
    timeTakenSeconds: integer("time_taken_seconds").notNull().default(0),
    answers: jsonb("answers").$type<{ questionId: string; answer: string; correct: boolean }[]>().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("attempts_user_idx").on(t.userId), index("attempts_user_date_idx").on(t.userId, t.completedAt)],
);

export const flashcards = pgTable(
  "flashcards",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    front: text("front").notNull(),
    back: text("back").notNull(),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("flashcards_user_idx").on(t.userId), index("flashcards_note_idx").on(t.noteId)],
);

export const flashcardProgress = pgTable(
  "flashcard_progress",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    flashcardId: text("flashcard_id")
      .notNull()
      .references(() => flashcards.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("new"), // new | known | practice
    reviewCount: integer("review_count").notNull().default(0),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("fc_progress_unique").on(t.userId, t.flashcardId),
    index("fc_progress_user_idx").on(t.userId),
  ],
);

export const chats = pgTable(
  "chats",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    noteId: text("note_id").references(() => notes.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New conversation"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chats_user_idx").on(t.userId)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: id(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // user | assistant
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_chat_idx").on(t.chatId)],
);

export const studySessions = pgTable(
  "study_sessions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // quiz | flashcards | chat | reading | upload
    durationSeconds: integer("duration_seconds").notNull().default(0),
    itemsCount: integer("items_count").notNull().default(0),
    noteId: text("note_id").references(() => notes.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_date_idx").on(t.userId, t.createdAt)],
);

export const userProgress = pgTable(
  "user_progress",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastActiveDate: text("last_active_date"), // YYYY-MM-DD
    totalStudySeconds: integer("total_study_seconds").notNull().default(0),
    totalQuestionsAnswered: integer("total_questions_answered").notNull().default(0),
    totalCorrectAnswers: integer("total_correct_answers").notNull().default(0),
    totalFlashcardsReviewed: integer("total_flashcards_reviewed").notNull().default(0),
    dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(30),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_progress_user_idx").on(t.userId)],
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  notes: many(notes),
  subjects: many(subjects),
  quizzes: many(quizzes),
  chats: many(chats),
  progress: one(userProgress, { fields: [users.id], references: [userProgress.userId] }),
}));
export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  subject: one(subjects, { fields: [notes.subjectId], references: [subjects.id] }),
  flashcards: many(flashcards),
  quizzes: many(quizzes),
}));
export const subjectsRelations = relations(subjects, ({ many }) => ({ notes: many(notes) }));
export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  note: one(notes, { fields: [quizzes.noteId], references: [notes.id] }),
  questions: many(questions),
  attempts: many(quizAttempts),
}));
export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, { fields: [questions.quizId], references: [quizzes.id] }),
}));
export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
}));
export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
  note: one(notes, { fields: [flashcards.noteId], references: [notes.id] }),
  progress: many(flashcardProgress),
}));
export const flashcardProgressRelations = relations(flashcardProgress, ({ one }) => ({
  flashcard: one(flashcards, { fields: [flashcardProgress.flashcardId], references: [flashcards.id] }),
}));
export const chatsRelations = relations(chats, ({ one, many }) => ({
  note: one(notes, { fields: [chats.noteId], references: [notes.id] }),
  messages: many(chatMessages),
}));
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(chats, { fields: [chatMessages.chatId], references: [chats.id] }),
}));

export type User = typeof users.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type FlashcardProgress = typeof flashcardProgress.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
