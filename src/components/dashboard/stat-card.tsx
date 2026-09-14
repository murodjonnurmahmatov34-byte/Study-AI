import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, icon: Icon, hint, tone = "primary" }: { label: string; value: string | number; icon: LucideIcon; hint?: string; tone?: "primary" | "pink" | "amber" | "emerald" | "violet" | "sky" }) {
  const tones = {
    primary: "from-indigo-500 to-indigo-400",
    pink: "from-pink-500 to-rose-400",
    amber: "from-amber-500 to-orange-400",
    emerald: "from-emerald-500 to-teal-400",
    violet: "from-violet-500 to-purple-400",
    sky: "from-sky-500 to-cyan-400",
  };
  return (
    <Card className="p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("rounded-xl bg-gradient-to-br p-2.5 text-white shadow-md", tones[tone])}><Icon className="h-5 w-5" /></div>
      </div>
    </Card>
  );
}
