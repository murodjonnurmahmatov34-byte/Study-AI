import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const expected = store.get("google_oauth_state")?.value;
  store.delete("google_oauth_state");
  const fail = (reason: string) => NextResponse.redirect(new URL(`/login?error=${reason}`, req.url));
  if (!code || !state || state !== expected) return fail("oauth_state");
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return fail("oauth_token");
    const tokens = await tokenRes.json();
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) return fail("oauth_profile");
    const profile = (await infoRes.json()) as { sub: string; email: string; name?: string; picture?: string; email_verified?: boolean };
    if (!profile.email || profile.email_verified === false) return fail("oauth_email");
    const email = profile.email.toLowerCase();
    let [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      [user] = await db
        .insert(users)
        .values({ name: profile.name || email.split("@")[0], email, googleId: profile.sub, image: profile.picture, provider: "google" })
        .returning();
    } else if (!user.googleId) {
      await db.update(users).set({ googleId: profile.sub, image: user.image ?? profile.picture }).where(eq(users.id, user.id));
    }
    await createSession(user.id);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (e) {
    console.error("[google-oauth]", e);
    return fail("oauth_failed");
  }
}
