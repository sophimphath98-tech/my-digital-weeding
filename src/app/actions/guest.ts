"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/supabase/server";
import { getGuestByCode, WISHES_TAG } from "@/lib/event";

// Also enforced by the wish_limit trigger (supabase/migrations/0002_hardening.sql); keep the two in sync.
const MAX_WISHES_PER_GUEST = 5;

const codeSchema = z.string().min(1).max(32);

export async function trackOpen(code: string) {
  const parsed = codeSchema.safeParse(code);
  if (!parsed.success) return;
  const { error } = await db().rpc("track_guest_open", { p_code: parsed.data });
  if (error) console.error("track_guest_open failed:", error.message);
}

const rsvpSchema = z.object({
  code: codeSchema,
  status: z.enum(["yes", "no"]),
  count: z.coerce.number().int().min(0).max(20),
});

export async function submitRsvp(input: z.input<typeof rsvpSchema>) {
  const parsed = rsvpSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const { code, status, count } = parsed.data;
  const { error, count: updated } = await db()
    .from("guest")
    .update(
      { rsvp_status: status, rsvp_count: status === "yes" ? Math.max(1, count) : 0, rsvp_at: new Date().toISOString() },
      { count: "exact" },
    )
    .eq("code", code);
  if (error || !updated) return { ok: false as const, error: "not_found" };
  revalidatePath("/admin");
  return { ok: true as const };
}

const wishSchema = z.object({
  code: codeSchema,
  message: z.string().trim().min(1).max(500),
});

export async function submitWish(input: z.input<typeof wishSchema>) {
  const parsed = wishSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const guest = await getGuestByCode(parsed.data.code);
  if (!guest) return { ok: false as const, error: "not_found" };

  const { count } = await db().from("wish").select("id", { count: "exact", head: true }).eq("guest_id", guest.id);
  if ((count ?? 0) >= MAX_WISHES_PER_GUEST) return { ok: false as const, error: "limit" };

  const { data, error } = await db()
    .from("wish")
    .insert({ guest_id: guest.id, message: parsed.data.message })
    .select("id, message, created_at")
    .single();
  // The cheap count above handles the normal case; the trigger catches concurrent submissions.
  if (error?.message === "wish_limit") return { ok: false as const, error: "limit" };
  if (error) return { ok: false as const, error: "failed" };
  revalidateTag(WISHES_TAG);
  revalidatePath(`/i/${guest.code}`);
  return { ok: true as const, wish: { ...data, name: guest.name } };
}
