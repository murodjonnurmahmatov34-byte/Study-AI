import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { hashToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const { email } = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email") }).parse(await req.json());
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    // Always respond success to avoid leaking which emails exist.
    if (!user) return NextResponse.json({ ok: true });
    const token = randomBytes(32).toString("hex");
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const resetUrl = `${base}/reset-password?token=${token}`;
    // Email delivery is provider-specific; without an email provider configured we log the link
    // and return it in development so the flow is testable end-to-end.
    console.log(`[password-reset] ${email}: ${resetUrl}`);
    const dev = process.env.NODE_ENV !== "production" || process.env.EXPOSE_RESET_LINK === "true";
    return NextResponse.json({ ok: true, ...(dev ? { resetUrl } : {}) });
  } catch (e) {
    return handleApiError(e);
  }
}
