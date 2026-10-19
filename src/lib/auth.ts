import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";

export async function createSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isAdmin() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Call at the top of every admin server action / page. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
