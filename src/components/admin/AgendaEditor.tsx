"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveAgenda } from "@/app/actions/admin";
import { unwrap } from "@/lib/action-result";
import type { ScheduleDay } from "@/lib/types";
import { Button, Card, Input } from "./ui";

type Item = { key: string; time: string; name: string };
type Day = { key: string; title: string; date: string; items: Item[] };

const key = () => Math.random().toString(36).slice(2);

function swap<T>(arr: T[], i: number, j: number) {
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function AgendaEditor({ initial, onSaved }: { initial: ScheduleDay[]; onSaved: () => void }) {
  const [days, setDays] = useState<Day[]>(() =>
    initial.map((d) => ({
      key: d.id,
      title: d.title,
      date: d.date ?? "",
      items: d.items.map((i) => ({ key: i.id, time: i.time, name: i.name })),
    })),
  );
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const update = (fn: (d: Day[]) => Day[]) => {
    setDays(fn);
    setDirty(true);
    setMsg("");
  };
  const patchDay = (di: number, patch: Partial<Day>) => update((ds) => ds.map((d, i) => (i === di ? { ...d, ...patch } : d)));
  const patchItem = (di: number, ii: number, patch: Partial<Item>) =>
    update((ds) => ds.map((d, i) => (i === di ? { ...d, items: d.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) } : d)));

  return (
    <div className="space-y-4">
      {days.map((day, di) => (
        <Card key={day.key} className="space-y-3 p-4">
          <div className="flex gap-2">
            <Input value={day.title} onChange={(e) => patchDay(di, { title: e.target.value })} placeholder="កម្មវិធីថ្ងៃទីមួយ៖ ..." />
            <Input type="date" className="w-40" value={day.date} onChange={(e) => patchDay(di, { date: e.target.value })} />
          </div>
          <div className="space-y-2">
            {day.items.map((it, ii) => (
              <div key={it.key} className="flex items-center gap-2">
                <Input className="w-28" value={it.time} onChange={(e) => patchItem(di, ii, { time: e.target.value })} placeholder="07:00 AM" />
                <Input value={it.name} onChange={(e) => patchItem(di, ii, { name: e.target.value })} placeholder="ហែជំនូន" />
                <Button size="sm" variant="ghost" type="button" onClick={() => patchDay(di, { items: swap(day.items, ii, ii - 1) })} aria-label="Up">
                  <ArrowUp size={14} />
                </Button>
                <Button size="sm" variant="ghost" type="button" onClick={() => patchDay(di, { items: swap(day.items, ii, ii + 1) })} aria-label="Down">
                  <ArrowDown size={14} />
                </Button>
                <Button size="sm" variant="ghost" type="button" onClick={() => patchDay(di, { items: day.items.filter((_, j) => j !== ii) })} aria-label="Remove">
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <Button size="sm" variant="outline" type="button" onClick={() => patchDay(di, { items: [...day.items, { key: key(), time: "", name: "" }] })}>
              <Plus size={14} /> Add item
            </Button>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" type="button" onClick={() => update((ds) => swap(ds, di, di - 1))}>
                <ArrowUp size={14} />
              </Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => update((ds) => swap(ds, di, di + 1))}>
                <ArrowDown size={14} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                type="button"
                onClick={() => confirm("Remove this day?") && update((ds) => ds.filter((_, i) => i !== di))}
              >
                <Trash2 size={14} /> Remove day
              </Button>
            </div>
          </div>
        </Card>
      ))}
      <div className="flex items-center justify-between">
        <Button variant="outline" type="button" onClick={() => update((ds) => [...ds, { key: key(), title: "", date: "", items: [] }])}>
          <Plus size={16} /> Add day
        </Button>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-neutral-500">{msg}</span>}
          <Button
            type="button"
            disabled={!dirty || pending}
            onClick={() =>
              start(async () => {
                try {
                  unwrap(await saveAgenda(days.map((d) => ({ title: d.title, date: d.date || null, items: d.items.map(({ time, name }) => ({ time, name })) }))));
                  setDirty(false);
                  setMsg("Saved ✓");
                  onSaved();
                } catch (e) {
                  setMsg(e instanceof Error ? e.message : "Failed");
                }
              })
            }
          >
            {pending ? "Saving…" : "Save agenda"}
          </Button>
        </div>
      </div>
    </div>
  );
}
