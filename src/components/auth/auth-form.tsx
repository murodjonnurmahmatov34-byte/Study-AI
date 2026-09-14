"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.4 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/></svg>
  );
}

const ERRORS: Record<string, string> = {
  google_not_configured: "Google login isn't configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.",
  oauth_state: "Google sign-in was interrupted. Please try again.",
  oauth_failed: "Google sign-in failed. Please try again.",
  oauth_email: "We couldn't get a verified email from Google.",
};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const oauthError = params.get("error");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isDemo = params.get("demo") === "1";
  const [form, setForm] = useState({ name: "", email: isDemo ? "demo@studyai.app" : "", password: isDemo ? "demo1234" : "" });

  function validate() {
    const e: Record<string, string> = {};
    if (mode === "register" && form.name.trim().length < 2) e.name = "Please enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (mode === "register" ? form.password.length < 8 : !form.password) e.password = mode === "register" ? "Use at least 8 characters" : "Password is required";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toast.success(mode === "login" ? "Welcome back!" : "Account created. Welcome to StudyAI!");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "login" ? "Sign in to continue studying." : "Start learning smarter in under a minute."}
      </p>
      {isDemo && mode === "login" && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">Demo credentials are pre-filled — just click <b>Sign in</b> to explore StudyAI with sample data.</div>
      )}
      {oauthError && ERRORS[oauthError] && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">{ERRORS[oauthError]}</div>
      )}
      <a href="/api/auth/google" className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-xl border bg-card text-sm font-medium transition hover:bg-muted">
        <GoogleIcon /> Continue with Google
      </a>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with email<span className="h-px flex-1 bg-border" /></div>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {mode === "register" && (
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alex Johnson" autoComplete="name" aria-invalid={!!errors.name} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@school.edu" autoComplete="email" aria-invalid={!!errors.email} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" && <Link href="/forgot-password" className="mb-1.5 text-xs text-primary hover:underline">Forgot password?</Link>}
          </div>
          <div className="relative">
            <Input id="password" type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" autoComplete={mode === "login" ? "current-password" : "new-password"} aria-invalid={!!errors.password} className="pr-10" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password visibility">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg" variant="gradient" loading={loading}>
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>Don’t have an account? <Link href="/register" className="font-medium text-primary hover:underline">Sign up</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></>
        )}
      </p>
      {mode === "login" && (
        <p className="mt-3 text-center text-xs text-muted-foreground">Demo account: <span className="font-mono">demo@studyai.app</span> / <span className="font-mono">demo1234</span></p>
      )}
    </div>
  );
}
