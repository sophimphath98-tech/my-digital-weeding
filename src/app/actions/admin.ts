"use server";

import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { createSession, destroySession, requireAdmin } from "@/lib/auth";
import { EVENT_TAG, WISHES_TAG } from "@/lib/event";
import { newGuestCode } from "@/lib/guest-code";
import { db, MEDIA_BUCKET } from "@/lib/supabase/server";
import { eventConfigSchema, invitationTextSchema, sectionsSchema } from "@/lib/types";

/** Runs an admin action, returning failures as data so their messages reach the client in production. */
async function adminAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  await requireAdmin();
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    unstable_rethrow(e);
    console.error(e);
    if (e instanceof z.ZodError) return { ok: false, error: z.prettifyError(e) };
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

/* ---------- auth ---------- */

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

export async function login(_: unknown, formData: FormData) {
  const expectedRaw = (process.env.ADMIN_PASSWORD ?? "").trim();
  if (!expectedRaw) {
    console.error("ADMIN_PASSWORD is not set");
    return { error: "Admin login is not configured" };
  }

  const ip = await clientIp();
  const since = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();
  const { count, error: countErr } = await db()
    .from("login_attempt")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("at", since);
  if (countErr) {
    console.error("login_attempt lookup failed:", countErr.message);
    return { error: "Server error, please try again" };
  }
  if ((count ?? 0) >= LOGIN_MAX_FAILURES) return { error: "Too many attempts. Try again in 15 minutes." };

  const given = Buffer.from(String(formData.get("password") ?? "").trim());
  const expected = Buffer.from(expectedRaw);
  const ok = given.length === expected.length && timingSafeEqual(given, expected);
  if (!ok) {
    await db().from("login_attempt").insert({ ip });
    return { error: "Wrong password" };
  }
  try {
    await createSession();
  } catch (e) {
    console.error("createSession failed:", e);
    return { error: "Server misconfigured (SESSION_SECRET)" };
  }
  // Clear this IP's failures, and prune expired rows from everyone else.
  await Promise.all([
    db().from("login_attempt").delete().eq("ip", ip),
    db().from("login_attempt").delete().lt("at", since),
  ]);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ---------- guests ---------- */

const guestSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long (max 120)"),
  phone: z.string().trim().max(40, "Phone is too long (max 40)").optional().nullable(),
  group_tag: z.string().trim().max(60, "Group is too long (max 60)").optional().nullable(),
  lang: z.enum(["kh", "en"]).default("kh"),
  note: z.string().trim().max(500, "Note is too long (max 500)").optional().nullable(),
});
export type GuestInput = z.input<typeof guestSchema>;

const idSchema = z.uuid();
const MAX_BULK = 5000;

function clean(input: GuestInput) {
  const g = guestSchema.parse(input);
  return { ...g, phone: g.phone || null, group_tag: g.group_tag || null, note: g.note || null };
}

async function insertWithCodes(rows: ReturnType<typeof clean>[]) {
  // One statement, so a bulk import either fully succeeds or adds nothing.
  // Retry on the (very unlikely) unique-code collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await db().from("guest").insert(rows.map((r) => ({ ...r, code: newGuestCode() })));
    if (!error) return;
    if (error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Could not generate unique guest codes");
}

export async function createGuest(input: GuestInput) {
  return adminAction(async () => {
    await insertWithCodes([clean(input)]);
    revalidatePath("/admin", "layout");
  });
}

export async function updateGuest(id: string, input: GuestInput) {
  return adminAction(async () => {
    const { error } = await db().from("guest").update(clean(input)).eq("id", idSchema.parse(id));
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
  });
}

export async function deleteGuests(ids: string[]) {
  return adminAction(async () => {
    const { error } = await db().from("guest").delete().in("id", z.array(idSchema).parse(ids));
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
  });
}

export async function regenerateGuestCode(id: string) {
  return adminAction(async () => {
    const { error } = await db().from("guest").update({ code: newGuestCode() }).eq("id", idSchema.parse(id));
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
  });
}

export async function bulkCreateGuests(rows: GuestInput[]) {
  return adminAction(async () => {
    if (rows.length > MAX_BULK) throw new Error(`Too many rows (max ${MAX_BULK} per import)`);
    // Validate everything first and report every bad row, rather than failing on the first one.
    const problems: string[] = [];
    const cleaned: ReturnType<typeof clean>[] = [];
    rows.forEach((row, i) => {
      if (!row.name?.trim()) return;
      const parsed = guestSchema.safeParse(row);
      if (parsed.success) cleaned.push(clean(row));
      else problems.push(`Row ${i + 1}: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`);
    });
    if (problems.length) {
      const more = problems.length > 5 ? ` (and ${problems.length - 5} more)` : "";
      throw new Error(`Nothing was added. ${problems.slice(0, 5).join("; ")}${more}`);
    }
    if (cleaned.length) await insertWithCodes(cleaned);
    revalidatePath("/admin", "layout");
    return { count: cleaned.length };
  });
}

export async function resetGuestRsvp(id: string) {
  return adminAction(async () => {
    const { error } = await db()
      .from("guest")
      .update({ rsvp_status: "pending", rsvp_count: 0, rsvp_at: null })
      .eq("id", idSchema.parse(id));
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
  });
}

/* ---------- event / customize ---------- */

const eventSchema = z.object({
  groom: z.string().max(120),
  bride: z.string().max(120),
  event_date: z.string().nullable(),
  config: eventConfigSchema,
  text_kh: invitationTextSchema,
  text_en: invitationTextSchema,
  sections: sectionsSchema,
});

export async function saveEvent(input: z.input<typeof eventSchema>) {
  return adminAction(async () => {
    const data = eventSchema.parse(input);
    const { error } = await db()
      .from("event")
      .upsert({ id: 1, ...data, event_date: data.event_date || null, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    revalidateTag(EVENT_TAG);
    revalidatePath("/", "layout");
  });
}

const agendaSchema = z
  .array(
    z.object({
      title: z.string().max(200),
      date: z.iso.date().nullable().or(z.literal("").transform(() => null)),
      items: z.array(z.object({ time: z.string().max(60), name: z.string().max(300) })).max(100),
    }),
  )
  .max(20);
export type AgendaInput = z.input<typeof agendaSchema>;

/** Replaces the whole agenda with the submitted one (days + items, in order), in one transaction. */
export async function saveAgenda(input: AgendaInput) {
  return adminAction(async () => {
    const days = agendaSchema.parse(input).map((d) => ({
      ...d,
      items: d.items.filter((it) => it.name.trim() || it.time.trim()),
    }));
    const { error } = await db().rpc("save_agenda", { p_days: days });
    if (error) throw new Error(error.message);
    revalidateTag(EVENT_TAG);
    revalidatePath("/", "layout");
  });
}

// Keep in sync with allowed_mime_types on the media bucket (supabase/migrations/0002_hardening.sql).
// SVG is deliberately excluded: it can carry script and the bucket is public.
const ALLOWED_TYPES = /^(image\/(png|jpe?g|webp|gif|avif)|audio\/(mpeg|mp3|mp4|aac|ogg|wav|x-m4a))$/;
const MAX_UPLOAD = 15 * 1024 * 1024;

/**
 * Returns a one-time URL the browser uploads the file to directly. Uploading through a server action
 * would hit Vercel's 4.5 MB request body limit.
 */
export async function createUpload(file: { name: string; type: string; size: number }) {
  return adminAction(async () => {
    if (!ALLOWED_TYPES.test(file.type)) throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
    if (file.size > MAX_UPLOAD) throw new Error("File too large (max 15MB)");
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bucket = db().storage.from(MEDIA_BUCKET);
    const { data, error } = await bucket.createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { uploadUrl: data.signedUrl, publicUrl: bucket.getPublicUrl(path).data.publicUrl };
  });
}

/* ---------- wishes ---------- */

export async function setWishApproved(id: string, approved: boolean) {
  return adminAction(async () => {
    const { error } = await db().from("wish").update({ approved }).eq("id", idSchema.parse(id));
    if (error) throw new Error(error.message);
    revalidateTag(WISHES_TAG);
    revalidatePath("/", "layout");
  });
}

export async function deleteWish(id: string) {
  return adminAction(async () => {
    const { error } = await db().from("wish").delete().eq("id", idSchema.parse(id));
    if (error) throw new Error(error.message);
    revalidateTag(WISHES_TAG);
    revalidatePath("/", "layout");
  });
}
