import { NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { passwordResetTokens, sessions, users } from "@/db/schema";
import { hashPassword, hashToken } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const { token, password } = z
      .object({ token: z.string().min(10), password: z.string().min(8, "Password must be at least 8 characters") })
      .parse(await req.json());
    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.tokenHash, hashToken(token)), gt(passwordResetTokens.expiresAt, new Date()), isNull(passwordResetTokens.usedAt)));
    if (!row) return jsonError("This reset link is invalid or has expired.", 400);
    await db.update(users).set({ passwordHash: await hashPassword(password), updatedAt: new Date() }).where(eq(users.id, row.userId));
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id));
    await db.delete(sessions).where(eq(sessions.userId, row.userId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
