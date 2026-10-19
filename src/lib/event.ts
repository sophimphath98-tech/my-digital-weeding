import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./supabase/server";
import {
  eventConfigSchema,
  invitationTextSchema,
  sectionsSchema,
  type EventData,
  type Guest,
  type ScheduleDay,
  type TimelineItem,
} from "./types";

export const EVENT_TAG = "event";
export const WISHES_TAG = "wishes";

// Event, agenda and approved wishes change rarely; cache them and bust via revalidateTag in admin actions.
export const getEvent = unstable_cache(fetchEvent, ["event"], { tags: [EVENT_TAG] });
export const getAgenda = unstable_cache(fetchAgenda, ["agenda"], { tags: [EVENT_TAG] });
export const getApprovedWishes = unstable_cache(fetchApprovedWishes, ["approved-wishes"], { tags: [WISHES_TAG] });

async function fetchEvent(): Promise<EventData> {
  const { data, error } = await db().from("event").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return {
    groom: data?.groom ?? "",
    bride: data?.bride ?? "",
    event_date: data?.event_date ?? null,
    config: eventConfigSchema.parse(data?.config ?? {}),
    text_kh: invitationTextSchema.parse(data?.text_kh ?? {}),
    text_en: invitationTextSchema.parse(data?.text_en ?? {}),
    sections: sectionsSchema.parse(data?.sections ?? {}),
  };
}

async function fetchAgenda(): Promise<ScheduleDay[]> {
  const [{ data: days, error: e1 }, { data: items, error: e2 }] = await Promise.all([
    db().from("schedule_day").select("*").order("sort"),
    db().from("timeline_item").select("*").order("sort"),
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);
  return (days ?? []).map((d) => ({
    ...d,
    items: (items ?? []).filter((i: TimelineItem) => i.day_id === d.id),
  }));
}

export async function getGuestByCode(code: string): Promise<Guest | null> {
  const { data, error } = await db().from("guest").select("*").eq("code", code).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function fetchApprovedWishes(limit = 50) {
  const { data, error } = await db()
    .from("wish")
    .select("id, message, created_at, guest:guest_id(name)")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((w) => ({
    id: w.id as string,
    message: w.message as string,
    created_at: w.created_at as string,
    name: (w.guest as unknown as { name: string } | null)?.name ?? "",
  }));
}

export function googleFontsHref(fonts: string[]) {
  const families = [...new Set(fonts.filter(Boolean))]
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
