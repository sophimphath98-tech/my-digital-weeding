"use client";

import { useState, useTransition } from "react";
import { submitRsvp } from "@/app/actions/guest";
import type { Labels } from "./i18n";

type Status = "pending" | "yes" | "no";

export function Rsvp({
  code,
  initialStatus,
  initialCount,
  preview,
  t,
}: {
  code: string;
  initialStatus: Status;
  initialCount: number;
  preview: boolean;
  t: Labels;
}) {
  const [saved, setSaved] = useState<Status>(initialStatus);
  const [editing, setEditing] = useState(initialStatus === "pending");
  const [choice, setChoice] = useState<"yes" | "no">(initialStatus === "no" ? "no" : "yes");
  const [count, setCount] = useState(Math.max(1, initialCount || 1));
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (!editing && saved !== "pending") {
    return (
      <div className="card p-5 text-center">
        <p>{saved === "yes" ? t.rsvpYes : t.rsvpNo}</p>
        {saved === "yes" && (
          <p className="mt-1 text-sm opacity-80">
            {t.people}: {count}
          </p>
        )}
        <button className="mt-3 text-sm underline" onClick={() => setEditing(true)}>
          {t.change}
        </button>
      </div>
    );
  }

  return (
    <form
      className="card space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        if (preview) {
          setSaved(choice);
          setEditing(false);
          return;
        }
        start(async () => {
          const res = await submitRsvp({ code, status: choice, count });
          if (res.ok) {
            setSaved(choice);
            setEditing(false);
          } else setError(t.error);
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        {(["yes", "no"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setChoice(v)}
            className="border px-3 py-2 text-sm transition"
            style={{
              borderRadius: "var(--radius)",
              borderColor: "var(--primary)",
              background: choice === v ? "var(--primary)" : "transparent",
              color: choice === v ? "#fff" : "var(--text)",
            }}
          >
            {v === "yes" ? t.attend : t.decline}
          </button>
        ))}
      </div>
      {choice === "yes" && (
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>{t.people}</span>
          <div className="flex items-center gap-2">
            <button type="button" className="h-8 w-8 rounded-full border" style={{ borderColor: "var(--primary)" }} onClick={() => setCount((c) => Math.max(1, c - 1))}>
              −
            </button>
            <span className="w-6 text-center tabular-nums">{count}</span>
            <button type="button" className="h-8 w-8 rounded-full border" style={{ borderColor: "var(--primary)" }} onClick={() => setCount((c) => Math.min(20, c + 1))}>
              +
            </button>
          </div>
        </label>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={pending} className="btn-primary w-full py-2.5 disabled:opacity-60">
        {pending ? "…" : t.submit} {preview && <span className="text-xs opacity-80">{t.previewOnly}</span>}
      </button>
    </form>
  );
}
