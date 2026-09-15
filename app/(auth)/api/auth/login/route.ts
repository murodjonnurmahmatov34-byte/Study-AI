import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());
    const [user] = await db.select().from(users).where(eq(users.email, body.email));
    if (!user || !user.passwordHash) return jsonError("Invalid email or password.", 401);
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return jsonError("Invalid email or password.", 401);
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
