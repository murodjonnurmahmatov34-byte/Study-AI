import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { userProgress, users } from "@/db/schema";
import { requireUser, verifyPassword, hashPassword } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  dailyGoalMinutes: z.coerce.number().int().min(5).max(600).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    if (body.name) await db.update(users).set({ name: body.name, updatedAt: new Date() }).where(eq(users.id, user.id));
    if (body.dailyGoalMinutes) {
      await db
        .insert(userProgress)
        .values({ userId: user.id, dailyGoalMinutes: body.dailyGoalMinutes })
        .onConflictDoUpdate({ target: userProgress.userId, set: { dailyGoalMinutes: body.dailyGoalMinutes } });
    }
    if (body.newPassword) {
      const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id));
      if (row.hash) {
        if (!body.currentPassword || !(await verifyPassword(body.currentPassword, row.hash))) return jsonError("Current password is incorrect.", 400);
      }
      await db.update(users).set({ passwordHash: await hashPassword(body.newPassword) }).where(eq(users.id, user.id));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    await db.delete(users).where(eq(users.id, user.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
