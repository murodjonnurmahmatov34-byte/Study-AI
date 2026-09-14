import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = registerSchema.parse(await req.json());
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email));
    if (existing) return jsonError("An account with this email already exists.", 409);
    const [user] = await db
      .insert(users)
      .values({ name: body.name, email: body.email, passwordHash: await hashPassword(body.password) })
      .returning({ id: users.id });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
