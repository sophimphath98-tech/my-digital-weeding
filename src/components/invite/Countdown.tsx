"use client";

import { useEffect, useState } from "react";
import type { Labels } from "./i18n";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    done: ms === 0,
    d: Math.floor(ms / 86_400_000),
    h: Math.floor(ms / 3_600_000) % 24,
    m: Math.floor(ms / 60_000) % 60,
    s: Math.floor(ms / 1000) % 60,
  };
}

export function Countdown({ date, t }: { date: string; t: Labels }) {
  const target = new Date(date).getTime();
  const [left, setLeft] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setLeft(diff(target));
    const id = setInterval(() => setLeft(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!left) return <div className="h-20" />;
  if (left.done) return <p className="font-title text-center text-lg">{t.started}</p>;

  const cells: [number, string][] = [
    [left.d, t.days],
    [left.h, t.hours],
    [left.m, t.minutes],
    [left.s, t.seconds],
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {cells.map(([n, label]) => (
        <div key={label} className="card py-3 text-center">
          <div className="text-2xl font-semibold tabular-nums" style={{ color: "var(--primary)" }}>
            {String(n).padStart(2, "0")}
          </div>
          <div className="mt-1 text-xs">{label}</div>
        </div>
      ))}
    </div>
  );
}
