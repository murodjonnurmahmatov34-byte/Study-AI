"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "What file types can I upload?", a: "PDF, DOCX, TXT and Markdown files up to 10 MB. You can also paste or type notes manually." },
  { q: "Does the AI make things up?", a: "StudyAI is instructed to answer strictly from your uploaded material. If the answer isn’t in your notes, it will tell you so instead of guessing." },
  { q: "Which AI models do you use?", a: "StudyAI works with OpenAI, Anthropic, or any OpenAI-compatible provider. The provider is configured by the app administrator through environment variables." },
  { q: "Is my data private?", a: "Yes. Your notes, quizzes, chats, and progress are only accessible to your account and protected by server-side authorization on every request." },
  { q: "Is StudyAI free?", a: "You can create a free account and start uploading notes right away." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-10 space-y-3">
      {faqs.map((f, i) => (
        <div key={f.q} className="rounded-2xl border bg-card shadow-sm">
          <button className="flex w-full items-center justify-between p-5 text-left font-medium" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
            {f.q}
            <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open === i && "rotate-180")} />
          </button>
          <div className={cn("grid transition-all duration-300", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden"><p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}
