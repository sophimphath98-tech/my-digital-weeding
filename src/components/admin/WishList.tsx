"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteWish, setWishApproved } from "@/app/actions/admin";
import type { ActionResult } from "@/lib/action-result";
import type { Wish } from "@/lib/types";
import { Badge, Button, Card } from "./ui";

export function WishList({ wishes }: { wishes: Wish[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const run = (action: () => Promise<ActionResult>) =>
    start(async () => {
      setError("");
      const res = await action();
      if (!res.ok) setError(res.error);
    });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        Wishes <span className="text-base font-normal text-neutral-400">({wishes.length})</span>
      </h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {wishes.length === 0 && <Card className="text-center text-sm text-neutral-500">No wishes yet.</Card>}
      <div className="grid gap-3 md:grid-cols-2">
        {wishes.map((w) => (
          <Card key={w.id} className={w.approved ? "" : "opacity-60"}>
            <p className="whitespace-pre-line text-sm">{w.message}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="text-xs text-neutral-500">
                <span className="font-medium text-neutral-700">{w.guest?.name}</span> · {new Date(w.created_at).toLocaleString("en-GB", { timeZone: "Asia/Phnom_Penh" })}
                {!w.approved && (
                  <span className="ml-2">
                    <Badge tone="amber">Hidden</Badge>
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => run(() => setWishApproved(w.id, !w.approved))}
                  title={w.approved ? "Hide from invitation" : "Show on invitation"}
                >
                  {w.approved ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  disabled={pending}
                  onClick={() => confirm("Delete this wish?") && run(() => deleteWish(w.id))}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
