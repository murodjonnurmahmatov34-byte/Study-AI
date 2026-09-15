import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FAQ } from "@/components/landing/faq";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  FileUp,
  Layers,
  MessageSquare,
  Sparkles,
  Star,
  Upload,
  Zap,
} from "lucide-react";

const features = [
  { icon: FileUp, title: "Upload anything", desc: "PDF, DOCX, or plain text. We extract the content and get it ready for AI in seconds." },
  { icon: BookOpen, title: "Smart summaries", desc: "Get concise summaries, key points, and important terms from any lecture or chapter." },
  { icon: Brain, title: "Adaptive quizzes", desc: "Generate multiple-choice and true/false quizzes at the difficulty you choose." },
  { icon: Layers, title: "Flashcards that stick", desc: "Auto-generated flashcards with spaced review to lock knowledge into long-term memory." },
  { icon: MessageSquare, title: "Ask your notes", desc: "Chat with an AI tutor that answers strictly from your material — no hallucinated facts." },
  { icon: BarChart3, title: "Track progress", desc: "Streaks, accuracy, weekly activity, and per-subject performance in beautiful charts." },
];

const steps = [
  { n: "01", title: "Upload your notes", desc: "Drop in lecture slides, textbook chapters, or handwritten notes you've typed up." },
  { n: "02", title: "AI processes them", desc: "StudyAI summarizes, extracts key terms, and prepares quizzes & flashcards." },
  { n: "03", title: "Study & track", desc: "Take quizzes, flip flashcards, ask questions, and watch your progress grow." },
];

const testimonials = [
  { name: "Maya R.", role: "Pre-med student", quote: "I went from cramming the night before to actually understanding biochem. The quizzes catch exactly what I don't know.", stars: 5 },
  { name: "Daniel K.", role: "CS undergrad", quote: "Chatting with my own lecture notes feels like having a TA available 24/7. It refuses to make stuff up, which I love.", stars: 5 },
  { name: "Sofia L.", role: "Law student", quote: "Flashcards from 80-page readings in one click. My retention has genuinely doubled this semester.", stars: 5 },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  return (
    <div className="relative overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#testimonials" className="hover:text-foreground">Testimonials</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button asChild><Link href="/dashboard">Dashboard <ArrowRight className="h-4 w-4" /></Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/login">Sign in</Link></Button>
                <Button asChild variant="gradient"><Link href="/register">Get Started</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Your personal AI study companion
          </span>
          <h1 className="mt-6 animate-fade-up text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl [animation-delay:100ms]">
            Study smarter <span className="bg-gradient-to-r from-primary via-violet-500 to-accent bg-clip-text text-transparent">with AI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg text-muted-foreground [animation-delay:200ms]">
            Upload your notes and StudyAI turns them into summaries, quizzes, flashcards, and a tutor that answers questions from your own material. Learn faster, remember longer.
          </p>
          <div className="mt-8 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:300ms]">
            <Button asChild size="lg" variant="gradient" className="w-full sm:w-auto"><Link href="/register">Get Started — it’s free <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto"><Link href="/login?demo=1">Try Demo</Link></Button>
          </div>
          <p className="mt-4 animate-fade-up text-xs text-muted-foreground [animation-delay:400ms]">No credit card required · Works with PDF, DOCX & TXT</p>
        </div>

        {/* Hero mock */}
        <div className="relative mx-auto mt-16 max-w-5xl animate-fade-up [animation-delay:500ms]">
          <div className="rounded-3xl border bg-card/80 p-2 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="grid gap-2 rounded-2xl bg-muted/50 p-4 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><Upload className="h-4 w-4 text-primary" /> Photosynthesis.pdf</div>
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-full rounded bg-muted" /><div className="h-2 w-5/6 rounded bg-muted" /><div className="h-2 w-4/6 rounded bg-muted" />
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-500"><CheckCircle2 className="h-3.5 w-3.5" /> Processed · Summary ready</div>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><Brain className="h-4 w-4 text-accent" /> Quiz · Question 3/10</div>
                <p className="mt-3 text-xs text-muted-foreground">Where does the light-dependent reaction take place?</p>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="rounded-lg border px-2 py-1.5">Stroma</div>
                  <div className="rounded-lg border border-emerald-500 bg-emerald-500/10 px-2 py-1.5 font-medium text-emerald-600 dark:text-emerald-400">Thylakoid membrane ✓</div>
                  <div className="rounded-lg border px-2 py-1.5">Mitochondria</div>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="h-4 w-4 text-violet-500" /> This week</div>
                <div className="mt-4 flex h-24 items-end gap-1.5">
                  {[40, 65, 50, 80, 70, 95, 60].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-accent animate-float" style={{ height: `${h}%`, animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">🔥 12-day streak · 87% accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 md:grid-cols-4">
          {[["50k+", "Notes processed"], ["1.2M", "Quiz questions answered"], ["92%", "Report better grades"], ["4.9/5", "Average rating"]].map(([v, l]) => (
            <div key={l} className="text-center">
              <p className="bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl font-extrabold text-transparent">{v}</p>
              <p className="mt-1 text-sm text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to ace your exams</h2>
          <p className="mt-4 text-muted-foreground">One place for your materials, powered by AI that actually understands them.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
              <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 p-3 text-primary transition-transform group-hover:scale-110"><Icon className="h-6 w-6" /></div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-muted/40 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">From messy notes to mastery in three simple steps.</p>
          </div>
          <div className="relative mt-14 grid gap-8 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block" />
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl border bg-card p-6 text-center shadow-sm">
                <div className="mx-auto -mt-12 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-white shadow-lg shadow-primary/30">{s.n}</div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Loved by students everywhere</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex gap-0.5 text-amber-400">{Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
              <blockquote className="mt-4 text-sm leading-relaxed">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">{t.name[0]}</div>
                <div><p className="text-sm font-semibold">{t.name}</p><p className="text-xs text-muted-foreground">{t.role}</p></div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-muted/40 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
          <FAQ />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 p-12 text-center text-white shadow-2xl shadow-primary/30">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <Zap className="mx-auto h-10 w-10" />
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Ready to study smarter?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">Join thousands of students who learn faster with StudyAI. Free to start.</p>
          <Button asChild size="lg" className="mt-8 bg-white text-indigo-600 hover:bg-white/90"><Link href="/register">Create free account <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo />
          <div className="flex gap-6">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </div>
          <p>© {new Date().getFullYear()} StudyAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
