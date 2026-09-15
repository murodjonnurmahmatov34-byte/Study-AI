import "server-only";
import { z } from "zod";

/**
 * AI service layer.
 * Provider is configured via environment variables:
 *   AI_PROVIDER = openai | anthropic | openai-compatible | local
 *   AI_API_KEY  = provider API key
 *   AI_MODEL    = model name (e.g. gpt-4o-mini, claude-3-5-haiku-latest)
 *   AI_BASE_URL = optional custom base URL (Groq, Ollama, Together, etc.)
 *
 * When no API key is configured the layer falls back to a deterministic
 * local extractive engine so the product remains fully functional in dev.
 */

export type QuizSettings = {
  count: number;
  difficulty: "easy" | "medium" | "hard";
  type: "multiple_choice" | "true_false" | "mixed";
};

export type SummaryResult = {
  summary: string;
  keyPoints: string[];
  keyTerms: { term: string; definition: string }[];
};

export type GeneratedQuestion = {
  type: "multiple_choice" | "true_false";
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type GeneratedFlashcard = { front: string; back: string };

const MAX_CONTEXT_CHARS = 24000;

export function getAIProvider() {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  const key = process.env.AI_API_KEY;
  if (!key || provider === "local" || provider === "") {
    return { name: "local" as const, model: "extractive-v1" };
  }
  if (provider === "anthropic") return { name: "anthropic" as const, model: process.env.AI_MODEL || "claude-3-5-haiku-latest" };
  return { name: "openai" as const, model: process.env.AI_MODEL || "gpt-4o-mini" };
}

export function aiProviderLabel() {
  const p = getAIProvider();
  return p.name === "local" ? "Local engine (no API key configured)" : `${p.name} · ${p.model}`;
}

/* ------------------------------------------------------------------ */
/* Remote provider call                                                */
/* ------------------------------------------------------------------ */

async function callLLM(system: string, user: string, json = true): Promise<string> {
  const provider = getAIProvider();
  const key = process.env.AI_API_KEY!;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    if (provider.name === "anthropic") {
      const res = await fetch((process.env.AI_BASE_URL || "https://api.anthropic.com") + "/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: 4000,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
      if (!res.ok) throw new Error(`AI provider error (${res.status}): ${await res.text()}`);
      const data = await res.json();
      return data.content?.[0]?.text ?? "";
    }
    const res = await fetch((process.env.AI_BASE_URL || "https://api.openai.com/v1") + "/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.3,
        ...(json ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI provider error (${res.status}): ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

function parseJSON<T>(raw: string, schema: z.ZodType<T>): T {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return schema.parse(JSON.parse(slice));
}

function truncate(text: string) {
  return text.length > MAX_CONTEXT_CHARS ? text.slice(0, MAX_CONTEXT_CHARS) + "\n...[truncated]" : text;
}

/* ------------------------------------------------------------------ */
/* Local extractive engine (fallback)                                  */
/* ------------------------------------------------------------------ */

const STOPWORDS = new Set(
  "a an the and or but if then else of to in on at by for with from as is are was were be been being it its this that these those there their they them he she his her we you your our i me my not no yes do does did done have has had having can could should would will shall may might must into over under about after before between through during without within also such than too very more most much many some any each other which who whom whose what when where why how all both few less least own same so just only up down out off again further once here".split(
    " ",
  ),
);

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/)
    .map((s) => s.trim())
    .filter((s) => s.split(" ").length >= 5 && s.length < 400);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function wordFrequencies(text: string) {
  const freq = new Map<string, number>();
  for (const w of tokenize(text)) freq.set(w, (freq.get(w) ?? 0) + 1);
  return freq;
}

function rankSentences(text: string) {
  const sentences = splitSentences(text);
  const freq = wordFrequencies(text);
  return sentences
    .map((s, idx) => {
      const words = tokenize(s);
      const score = words.reduce((acc, w) => acc + (freq.get(w) ?? 0), 0) / Math.sqrt(words.length + 1);
      return { s, idx, score };
    })
    .sort((a, b) => b.score - a.score);
}

function extractTerms(text: string, limit = 8): { term: string; definition: string }[] {
  const sentences = splitSentences(text);
  const results: { term: string; definition: string }[] = [];
  const seen = new Set<string>();
  // Pattern-based definitions: "X is/are/refers to/means ..."
  for (const s of sentences) {
    const m = s.match(/^([A-Z][A-Za-z0-9\- ]{2,40}?)\s+(?:is|are|refers to|means|describes|was|were)\s+(.+)$/);
    if (m && !seen.has(m[1].toLowerCase())) {
      seen.add(m[1].toLowerCase());
      results.push({ term: m[1].trim(), definition: m[2].trim().replace(/[.]$/, "") });
    }
    if (results.length >= limit) break;
  }
  if (results.length < limit) {
    // Capitalized multi-word phrases and frequent words as terms
    const freq = wordFrequencies(text);
    const candidates = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w);
    for (const c of candidates) {
      if (results.length >= limit) break;
      if (seen.has(c)) continue;
      const sentence = sentences.find((s) => s.toLowerCase().includes(c));
      if (!sentence) continue;
      seen.add(c);
      results.push({ term: c.charAt(0).toUpperCase() + c.slice(1), definition: sentence });
    }
  }
  return results;
}

function localSummary(content: string): SummaryResult {
  const ranked = rankSentences(content);
  const top = ranked.slice(0, 4).sort((a, b) => a.idx - b.idx).map((r) => r.s);
  const keyPoints = ranked.slice(0, 6).sort((a, b) => a.idx - b.idx).map((r) => r.s);
  const summary = top.length ? top.join(" ") : content.slice(0, 400);
  return { summary, keyPoints: keyPoints.length ? keyPoints : [content.slice(0, 200)], keyTerms: extractTerms(content) };
}

function pickDistractors(answer: string, pool: string[], n: number): string[] {
  const out: string[] = [];
  for (const p of pool) {
    if (out.length >= n) break;
    if (p.toLowerCase() !== answer.toLowerCase() && !out.includes(p)) out.push(p);
  }
  const fillers = ["None of the above", "All of the above", "Not mentioned in the material"];
  let i = 0;
  while (out.length < n) out.push(fillers[i++ % fillers.length]);
  return out;
}

function localQuiz(content: string, settings: QuizSettings): GeneratedQuestion[] {
  const ranked = rankSentences(content);
  const freq = wordFrequencies(content);
  const globalTerms = [...freq.entries()]
    .filter(([w]) => w.length > 3)
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w);
  const questions: GeneratedQuestion[] = [];
  const used = new Set<number>();

  const minLen = settings.difficulty === "easy" ? 4 : settings.difficulty === "medium" ? 5 : 6;

  for (const { s, idx } of ranked) {
    if (questions.length >= settings.count) break;
    if (used.has(idx)) continue;
    const words = s.split(" ");
    const candidates = words
      .map((w, i) => ({ w: w.replace(/[^A-Za-z0-9-]/g, ""), i }))
      .filter(({ w }) => w.length >= minLen && !STOPWORDS.has(w.toLowerCase()) && /^[A-Za-z]/.test(w));
    if (!candidates.length) continue;
    // hard: pick the rarer word, easy: the most frequent
    candidates.sort((a, b) => {
      const fa = freq.get(a.w.toLowerCase()) ?? 0;
      const fb = freq.get(b.w.toLowerCase()) ?? 0;
      return settings.difficulty === "hard" ? fa - fb : fb - fa;
    });
    const target = candidates[0];
    used.add(idx);

    const wantTF =
      settings.type === "true_false" || (settings.type === "mixed" && questions.length % 2 === 1);

    if (wantTF) {
      const makeFalse = questions.length % 2 === 0;
      let statement = s;
      let explanation = `This statement appears in your material: "${s}"`;
      if (makeFalse) {
        const replacement = globalTerms.find((t) => t !== target.w.toLowerCase() && t.length >= 4) ?? "something else";
        const replaced = [...words];
        replaced[target.i] = words[target.i].replace(target.w, replacement);
        statement = replaced.join(" ");
        explanation = `False. The material actually says: "${s}"`;
      }
      questions.push({
        type: "true_false",
        question: `True or False: ${statement}`,
        options: ["True", "False"],
        correctAnswer: makeFalse ? "False" : "True",
        explanation,
      });
    } else {
      const blanked = [...words];
      blanked[target.i] = words[target.i].replace(target.w, "______");
      const distractors = pickDistractors(target.w, globalTerms.filter((t) => t.length >= 4), 3).map(
        (d) => d.charAt(0).toUpperCase() + d.slice(1),
      );
      const answer = target.w;
      const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
      questions.push({
        type: "multiple_choice",
        question: `Fill in the blank: ${blanked.join(" ")}`,
        options,
        correctAnswer: answer,
        explanation: `The original sentence in your notes reads: "${s}"`,
      });
    }
  }
  return questions;
}

function localFlashcards(content: string, count: number): GeneratedFlashcard[] {
  const terms = extractTerms(content, count);
  const cards: GeneratedFlashcard[] = terms.map((t) => ({ front: `What is ${t.term}?`, back: t.definition }));
  if (cards.length < count) {
    for (const { s } of rankSentences(content).slice(0, count - cards.length)) {
      const words = s.split(" ");
      const target = words.find((w) => w.length > 5 && !STOPWORDS.has(w.toLowerCase().replace(/[^a-z]/g, "")));
      if (!target) continue;
      cards.push({ front: s.replace(target, "______"), back: target.replace(/[^A-Za-z0-9-]/g, "") });
    }
  }
  return cards;
}

function localAnswer(content: string, question: string): string {
  const qTokens = new Set(tokenize(question));
  if (!qTokens.size) return "Could you rephrase your question? I need a bit more detail to search your notes.";
  const sentences = splitSentences(content);
  const scored = sentences
    .map((s) => {
      const t = tokenize(s);
      const overlap = t.filter((w) => qTokens.has(w)).length;
      return { s, score: overlap / Math.sqrt(t.length + 1), overlap };
    })
    .filter((r) => r.overlap > 0)
    .sort((a, b) => b.score - a.score);
  if (!scored.length || scored[0].overlap < Math.min(2, qTokens.size)) {
    return "I couldn't find information about that in the selected study material. Try rephrasing your question or selecting a different note.";
  }
  const best = scored.slice(0, 3).map((r) => r.s);
  return `Based on your uploaded material:\n\n${best.map((b) => `• ${b}`).join("\n")}\n\n_(Answer extracted directly from your notes by the local engine. Configure an AI provider for richer, conversational answers.)_`;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

const summarySchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()).min(1),
  keyTerms: z.array(z.object({ term: z.string(), definition: z.string() })),
});

export async function generateSummary(noteContent: string): Promise<SummaryResult> {
  const content = truncate(noteContent);
  if (getAIProvider().name === "local") return localSummary(content);
  const raw = await callLLM(
    "You are an expert study assistant. Respond ONLY with valid JSON matching: {\"summary\": string (3-5 sentences), \"keyPoints\": string[] (5-8 concise bullet points), \"keyTerms\": [{\"term\": string, \"definition\": string}] (5-10 important terms)}. Base everything strictly on the provided material.",
    `Study material:\n\n${content}`,
  );
  return parseJSON(raw, summarySchema);
}

const quizSchema = z.object({
  questions: z
    .array(
      z.object({
        type: z.enum(["multiple_choice", "true_false"]),
        question: z.string(),
        options: z.array(z.string()).min(2),
        correctAnswer: z.string(),
        explanation: z.string().default(""),
      }),
    )
    .min(1),
});

export async function generateQuiz(noteContent: string, settings: QuizSettings): Promise<GeneratedQuestion[]> {
  const content = truncate(noteContent);
  if (getAIProvider().name === "local") return localQuiz(content, settings);
  const typeInstruction =
    settings.type === "multiple_choice"
      ? "All questions must be multiple choice with exactly 4 options."
      : settings.type === "true_false"
        ? 'All questions must be true/false with options exactly ["True","False"].'
        : 'Mix multiple choice (4 options) and true/false (options exactly ["True","False"]).';
  const raw = await callLLM(
    `You are an expert quiz generator for students. Create exactly ${settings.count} ${settings.difficulty} difficulty questions based strictly on the provided material. ${typeInstruction} Respond ONLY with JSON: {"questions":[{"type":"multiple_choice"|"true_false","question":string,"options":string[],"correctAnswer":string (must exactly match one option),"explanation":string}]}`,
    `Study material:\n\n${content}`,
  );
  const parsed = parseJSON(raw, quizSchema);
  return parsed.questions
    .filter((q) => q.options.includes(q.correctAnswer))
    .slice(0, settings.count);
}

const flashcardSchema = z.object({ flashcards: z.array(z.object({ front: z.string(), back: z.string() })).min(1) });

export async function generateFlashcards(noteContent: string, count = 10): Promise<GeneratedFlashcard[]> {
  const content = truncate(noteContent);
  if (getAIProvider().name === "local") return localFlashcards(content, count);
  const raw = await callLLM(
    `You are an expert at creating study flashcards. Create ${count} flashcards from the material. Fronts should be concise questions or terms; backs should be clear, accurate answers from the material. Respond ONLY with JSON: {"flashcards":[{"front":string,"back":string}]}`,
    `Study material:\n\n${content}`,
  );
  return parseJSON(raw, flashcardSchema).flashcards.slice(0, count);
}

export async function askQuestion(
  noteContent: string,
  question: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<string> {
  const content = truncate(noteContent);
  if (getAIProvider().name === "local") return localAnswer(content, question);
  const historyText = history
    .slice(-8)
    .map((m) => `${m.role === "user" ? "Student" : "Assistant"}: ${m.content}`)
    .join("\n");
  return callLLM(
    "You are StudyAI, a helpful tutor. Answer the student's question using ONLY the provided study material. Quote or reference the material where helpful. If the answer cannot be found in the material, clearly say: \"That information is not available in the provided material.\" and do not invent an answer. Keep answers concise and well formatted with markdown.",
    `Study material:\n"""\n${content}\n"""\n\n${historyText ? `Conversation so far:\n${historyText}\n\n` : ""}Student question: ${question}`,
    false,
  );
}
