"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserAvatar } from "./sidebar";
import { formatDate } from "@/lib/utils";
import { Cpu } from "lucide-react";

type U = { id: string; name: string; email: string; image: string | null; provider: string; createdAt: string };

export function SettingsView({ user, dailyGoal, providerLabel }: { user: U; dailyGoal: number; providerLabel: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function patch(body: Record<string, unknown>, key: string, ok: string) {
    setBusy(key);
    try {
      const res = await fetch("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(ok);
      router.refresh();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function deleteAccount() {
    setBusy("delete");
    const res = await fetch("/api/settings", { method: "DELETE" });
    if (!res.ok) { setBusy(null); return toast.error("Failed to delete account"); }
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Account deleted");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <PageHeader title="Settings" description="Manage your profile and preferences." />
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle><CardDescription>Member since {formatDate(user.createdAt)}</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); patch({ name: new FormData(e.currentTarget).get("name") }, "profile", "Profile updated"); }} className="space-y-4">
            <div className="flex items-center gap-4"><UserAvatar user={user} className="h-16 w-16 text-xl" /><div><p className="font-medium">{user.name}</p><p className="text-sm text-muted-foreground">{user.email}</p><Badge variant="secondary" className="mt-1 capitalize">{user.provider} account</Badge></div></div>
            <div><Label htmlFor="name">Display name</Label><Input id="name" name="name" defaultValue={user.name} minLength={2} maxLength={60} required /></div>
            <Button type="submit" loading={busy === "profile"}>Save changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Study preferences</CardTitle><CardDescription>Set a daily goal to keep your streak alive.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); patch({ dailyGoalMinutes: Number(new FormData(e.currentTarget).get("goal")) }, "goal", "Daily goal updated"); }} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1"><Label htmlFor="goal">Daily goal (minutes)</Label><Input id="goal" name="goal" type="number" min={5} max={600} defaultValue={dailyGoal} /></div>
            <Button type="submit" loading={busy === "goal"}>Save</Button>
          </form>
          <div className="mt-6 flex items-center justify-between rounded-xl border p-4"><div><p className="text-sm font-medium">Appearance</p><p className="text-xs text-muted-foreground">Switch between light and dark mode.</p></div><ThemeToggle /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Security</CardTitle><CardDescription>{user.provider === "google" ? "Set a password to also sign in with email." : "Change your password."}</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const form = e.currentTarget; if (await patch({ currentPassword: fd.get("current") || undefined, newPassword: fd.get("new") }, "pw", "Password updated")) form.reset(); }} className="grid gap-4 sm:grid-cols-2">
            {user.provider !== "google" && <div><Label htmlFor="current">Current password</Label><Input id="current" name="current" type="password" autoComplete="current-password" /></div>}
            <div><Label htmlFor="new">New password</Label><Input id="new" name="new" type="password" minLength={8} required autoComplete="new-password" /></div>
            <div className="sm:col-span-2"><Button type="submit" loading={busy === "pw"}>Update password</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Cpu className="h-4 w-4" /> AI provider</CardTitle><CardDescription>Configured by the administrator via environment variables.</CardDescription></CardHeader>
        <CardContent>
          <Badge variant={providerLabel.startsWith("Local") ? "warning" : "success"}>{providerLabel}</Badge>
          {providerLabel.startsWith("Local") && <p className="mt-3 text-sm text-muted-foreground">Summaries, quizzes, flashcards and answers are currently produced by a local extractive engine. Set <code className="rounded bg-muted px-1">AI_PROVIDER</code>, <code className="rounded bg-muted px-1">AI_API_KEY</code> and <code className="rounded bg-muted px-1">AI_MODEL</code> in <code className="rounded bg-muted px-1">.env</code> to enable an LLM (OpenAI, Anthropic, or any OpenAI-compatible endpoint).</p>}
        </CardContent>
      </Card>

      <Card className="border-red-500/30">
        <CardHeader><CardTitle className="text-red-500">Danger zone</CardTitle><CardDescription>Permanently delete your account and all data.</CardDescription></CardHeader>
        <CardContent><Button variant="destructive" onClick={() => setConfirmDelete(true)}>Delete account</Button></CardContent>
      </Card>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={deleteAccount} loading={busy === "delete"} title="Delete your account?" description="This will permanently remove your notes, quizzes, flashcards, chats and progress. This cannot be undone." confirmText="Delete forever" />
    </div>
  );
}
