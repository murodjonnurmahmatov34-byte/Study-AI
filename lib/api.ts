import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof AuthError) return jsonError("Please sign in to continue.", 401);
  if (err instanceof ZodError) {
    return jsonError(err.issues.map((i) => i.message).join(", "), 400);
  }
  if (err instanceof Error) {
    console.error("[api]", err);
    return jsonError(err.message || "Something went wrong.", 500);
  }
  console.error("[api]", err);
  return jsonError("Something went wrong.", 500);
}
