/**
 * Server actions return this instead of throwing: Next.js hides thrown error messages in production,
 * so the admin would only ever see a generic "An error occurred".
 */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

/** Client-side: turn a failed result back into an Error with its real message. */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
