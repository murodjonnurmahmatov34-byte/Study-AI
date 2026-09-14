import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BookOpen, Brain, Sparkles } from "lucide-react";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <Logo className="relative text-white [&_span:last-child_span]:text-white" />
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight">Turn your notes into knowledge.</h1>
          <p className="max-w-md text-white/80">Upload your study materials and let AI summarize, quiz, and coach you — so you learn faster and remember longer.</p>
          <div className="grid gap-3">
            {[
              { icon: BookOpen, text: "Instant summaries & key points from any document" },
              { icon: Brain, text: "Adaptive quizzes and flashcards generated for you" },
              { icon: Sparkles, text: "Ask questions and get answers grounded in your notes" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
                <Icon className="h-5 w-5" /> <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} StudyAI. Built for learners.</p>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md animate-fade-up">{children}</div>
        </div>
      </div>
    </div>
  );
}
