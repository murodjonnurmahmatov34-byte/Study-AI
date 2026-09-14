import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userProgress } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { aiProviderLabel } from "@/lib/ai";
import { SettingsView } from "@/components/dashboard/settings-view";
export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const user = await requireUser();
  const [prog] = await db.select({ goal: userProgress.dailyGoalMinutes }).from(userProgress).where(eq(userProgress.userId, user.id));
  return <SettingsView user={{ ...user, createdAt: user.createdAt.toISOString() }} dailyGoal={prog?.goal ?? 30} providerLabel={aiProviderLabel()} />;
}
