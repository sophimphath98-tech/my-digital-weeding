import "server-only";
import { db } from "./supabase/server";
import type { Guest, Wish } from "./types";

// PostgREST returns at most `max_rows` (1000 by default) per request, so read in pages.
const PAGE_SIZE = 1000;

async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export async function listGuests(): Promise<Guest[]> {
  // Ordering by id as well keeps pages stable when created_at values tie (bulk imports).
  return fetchAll<Guest>((from, to) =>
    db().from("guest").select("*").order("created_at", { ascending: false }).order("id").range(from, to),
  );
}

export async function listWishes(): Promise<Wish[]> {
  return fetchAll<Wish>((from, to) =>
    db()
      .from("wish")
      .select("*, guest:guest_id(name)")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to),
  );
}

/** Lightweight version for the dashboard, which only shows the latest few. */
export async function listRecentWishes(limit: number): Promise<Wish[]> {
  const { data, error } = await db()
    .from("wish")
    .select("*, guest:guest_id(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Wish[];
}
