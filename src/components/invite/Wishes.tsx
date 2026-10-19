"use client";

import { useState, useTransition } from "react";
import { submitWish } from "@/app/actions/guest";
import type { Labels } from "./i18n";

export type PublicWish = { id: string; message: string; name: string; created_at: string };

export function Wishes({ code, initial, preview, t }: { code: string; initial: PublicWish[]; preview: boolean; t: Labels }) {
  const [wishes, setWishes] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <form
        className="card space-y-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const text = message.trim();
          if (!text) return;
          setError("");
          if (preview) {
            setWishes((w) => [{ id: crypto.randomUUID(), message: text, name: "Preview", created_at: new Date().toISOString() }, ...w]);
            setMessage("");
            return;
          }
          start(async () => {
            const res = await submitWish({ code, message: text });
            if (res.ok) {
              setWishes((w) => [res.wish, ...w]);
              setMessage("");
            } else setError(res.error === "limit" ? t.wishLimit : t.error);
          });
        }}
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t.wishPlaceholder}
          className="w-full resize-none border bg-white/70 p-3 text-sm outline-none focus:ring-2"
          style={{ borderRadius: "var(--radius)", borderColor: "color-mix(in srgb, var(--primary) 40%, transparent)" }}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={pending || !message.trim()} className="btn-primary w-full py-2 disabled:opacity-60">
          {pending ? "…" : t.send}
        </button>
      </form>

      {wishes.length > 0 && (
        <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {wishes.map((w) => (
            <li key={w.id} className="card p-3 text-sm">
              <p className="whitespace-pre-line">{w.message}</p>
              <p className="mt-1 text-right text-xs font-semibold" style={{ color: "var(--primary)" }}>
                — {w.name}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
