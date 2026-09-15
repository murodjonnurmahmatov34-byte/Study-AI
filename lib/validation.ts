import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export const noteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  content: z.string().trim().min(20, "Content must be at least 20 characters").max(200_000),
  subjectId: z.string().nullable().optional(),
});
export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color").default("#6366f1"),
});
export const quizSettingsSchema = z.object({
  noteId: z.string().min(1, "Select a note"),
  count: z.coerce.number().int().min(3).max(20),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["multiple_choice", "true_false", "mixed"]),
});
export const quizSubmitSchema = z.object({
  quizId: z.string().min(1),
  timeTakenSeconds: z.coerce.number().int().min(0).max(86400),
  answers: z.array(z.object({ questionId: z.string(), answer: z.string() })),
});
export const flashcardReviewSchema = z.object({
  flashcardId: z.string().min(1),
  status: z.enum(["known", "practice"]),
});
export const chatMessageSchema = z.object({
  chatId: z.string().optional(),
  noteId: z.string().min(1, "Select a note first"),
  message: z.string().trim().min(1, "Message is required").max(2000),
});
