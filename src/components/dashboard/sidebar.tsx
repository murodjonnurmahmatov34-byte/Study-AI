"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import type { SafeUser } from "@/lib/auth";
import { BarChart3, BookOpen, Brain, FolderOpen, Layers, LayoutDashboard, LogOut, Menu, MessageSquare, Settings, X } from "lucide-react";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/subjects", label: "Subjects", icon: FolderOpen },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/quiz", label: "Quizzes", icon: Brain },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function UserAvatar({ user, className }: { user: Pick<SafeUser, "name" | "image">; className?: string }) {
  if (user.image) return <img src={user.image} alt={user.name} className={cn("h-9 w-9 rounded-full object-cover", className)} />;
  return (
    <div className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white", className)}>
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 px-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4.5 w-4.5" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({ user }: { user: SafeUser }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }
  return (
    <div className="border-t p-3">
      <div className="flex items-center gap-3 rounded-xl p-2">
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <ThemeToggle />
      </div>
      <Button variant="ghost" className="mt-1 w-full justify-start text-muted-foreground" onClick={logout} loading={loading}>
        <LogOut className="h-4 w-4" /> Log out
      </Button>
    </div>
  );
}

export function Sidebar({ user }: { user: SafeUser }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card lg:flex">
      <div className="p-5"><Logo href="/dashboard" /></div>
      <NavLinks />
      <UserFooter user={user} />
    </aside>
  );
}

export function MobileNav({ user }: { user: SafeUser }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/80 px-4 backdrop-blur lg:hidden">
        <Logo href="/dashboard" />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-muted" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-2xl">
            <div className="flex items-center justify-between p-4">
              <Logo href="/dashboard" />
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-muted" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <UserFooter user={user} />
          </div>
        </div>
      )}
    </>
  );
}
