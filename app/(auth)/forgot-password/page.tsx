"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Enter a valid email address");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
      setResetUrl(data.resetUrl ?? null);
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent)
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500"><MailCheck className="h-7 w-7" /></div>
        <h1 className="text-2xl font-bold">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">If an account exists for <b>{email}</b>, we’ve sent a password reset link. It expires in 1 hour.</p>
        {resetUrl && (
          <div className="mt-4 rounded-xl border border-dashed bg-muted p-3 text-left text-xs">
            <p className="mb-1 font-medium">Development mode — no email provider configured:</p>
            <Link href={resetUrl} className="break-all text-primary underline">{resetUrl}</Link>
          </div>
        )}
        <Button asChild variant="outline" className="mt-6"><Link href="/login"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link></Button>
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enter your email and we’ll send you a reset link.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
        </div>
        <Button type="submit" className="w-full" size="lg" variant="gradient" loading={loading}>Send reset link</Button>
      </form>
      <Link href="/login" className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
    </div>
  );
}
