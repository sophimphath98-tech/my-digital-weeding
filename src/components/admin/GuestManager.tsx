"use client";

import { Check, Copy, Download, ExternalLink, Plus, QrCode, RefreshCw, Send, Trash2, Upload } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  bulkCreateGuests,
  createGuest,
  deleteGuests,
  regenerateGuestCode,
  resetGuestRsvp,
  updateGuest,
  type GuestInput,
} from "@/app/actions/admin";
import { unwrap } from "@/lib/action-result";
import { parseCsv, toCsv } from "@/lib/csv";
import type { Guest } from "@/lib/types";
import { Badge, Button, Card, Field, Input, Modal, Select, Textarea } from "./ui";

type Filter = { q: string; group: string; rsvp: string; opened: string };

export function GuestManager({ guests, siteUrl }: { guests: Guest[]; siteUrl: string }) {
  const [filter, setFilter] = useState<Filter>({ q: "", group: "", rsvp: "", opened: "" });
  const [editing, setEditing] = useState<Guest | "new" | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [qrFor, setQrFor] = useState<Guest | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [base, setBase] = useState(siteUrl);
  useEffect(() => {
    if (!siteUrl) setBase(window.location.origin);
  }, [siteUrl]);
  const linkFor = (g: Guest) => `${base}/i/${g.code}`;

  const groups = useMemo(() => [...new Set(guests.map((g) => g.group_tag).filter(Boolean))] as string[], [guests]);

  const visible = guests.filter((g) => {
    const q = filter.q.toLowerCase();
    if (q && !`${g.name} ${g.phone ?? ""} ${g.code}`.toLowerCase().includes(q)) return false;
    if (filter.group && g.group_tag !== filter.group) return false;
    if (filter.rsvp && g.rsvp_status !== filter.rsvp) return false;
    if (filter.opened === "yes" && !g.opened_at) return false;
    if (filter.opened === "no" && g.opened_at) return false;
    return true;
  });

  const copy = async (g: Guest) => {
    await navigator.clipboard.writeText(linkFor(g));
    setCopied(g.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const exportCsv = () => {
    const rows = [
      ["Name", "Phone", "Group", "Language", "Link", "Opened", "Open count", "RSVP", "Attendees", "Note"],
      ...visible.map((g) => [
        g.name,
        g.phone,
        g.group_tag,
        g.lang,
        linkFor(g),
        g.opened_at ? new Date(g.opened_at).toISOString() : "",
        g.open_count,
        g.rsvp_status,
        g.rsvp_count,
        g.note,
      ]),
    ];
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `guests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    // Revoking synchronously can cancel the download in Safari/Firefox.
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };

  const removeSelected = () => {
    if (!selected.size || !confirm(`Delete ${selected.size} guest(s)? Their RSVPs and wishes will be deleted too.`)) return;
    start(async () => {
      const res = await deleteGuests([...selected]);
      if (res.ok) setSelected(new Set());
      else alert(res.error);
    });
  };

  const allChecked = visible.length > 0 && visible.every((g) => selected.has(g.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          Guests <span className="text-base font-normal text-neutral-400">({guests.length})</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download size={16} /> Export
          </Button>
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Upload size={16} /> Bulk add
          </Button>
          <Button onClick={() => setEditing("new")}>
            <Plus size={16} /> Add guest
          </Button>
        </div>
      </div>

      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-4">
          <Input placeholder="Search name, phone, code…" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
          <Select value={filter.group} onChange={(e) => setFilter({ ...filter, group: e.target.value })}>
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </Select>
          <Select value={filter.rsvp} onChange={(e) => setFilter({ ...filter, rsvp: e.target.value })}>
            <option value="">All RSVP</option>
            <option value="yes">Attending</option>
            <option value="no">Declined</option>
            <option value="pending">No reply</option>
          </Select>
          <Select value={filter.opened} onChange={(e) => setFilter({ ...filter, opened: e.target.value })}>
            <option value="">Opened or not</option>
            <option value="yes">Opened</option>
            <option value="no">Not opened</option>
          </Select>
        </div>
      </Card>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-rose-50 px-4 py-2 text-sm">
          <span>{selected.size} selected</span>
          <Button size="sm" variant="danger" onClick={removeSelected} disabled={pending}>
            <Trash2 size={14} /> Delete
          </Button>
          <button className="text-neutral-500 hover:underline" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={() => setSelected(allChecked ? new Set() : new Set(visible.map((g) => g.id)))}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Group</th>
                <th className="px-3 py-2">Opened</th>
                <th className="px-3 py-2">RSVP</th>
                <th className="px-3 py-2 text-right">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-neutral-500">
                    {guests.length === 0 ? "No guests yet — add one or bulk add a list." : "No guests match the filters."}
                  </td>
                </tr>
              )}
              {visible.map((g) => (
                <tr key={g.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(g.id)}
                      onChange={() => {
                        const s = new Set(selected);
                        if (s.has(g.id)) s.delete(g.id);
                        else s.add(g.id);
                        setSelected(s);
                      }}
                      aria-label={`Select ${g.name}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button className="text-left font-medium hover:text-rose-600" onClick={() => setEditing(g)}>
                      {g.name}
                    </button>
                    <div className="text-xs text-neutral-400">
                      {g.code}
                      {g.phone && ` · ${g.phone}`}
                      {g.lang === "en" && " · EN"}
                    </div>
                  </td>
                  <td className="px-3 py-2">{g.group_tag && <Badge>{g.group_tag}</Badge>}</td>
                  <td className="px-3 py-2">
                    {g.opened_at ? (
                      <span title={new Date(g.opened_at).toLocaleString()}>
                        <Badge tone="blue">Opened ×{g.open_count}</Badge>
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {g.rsvp_status === "yes" && <Badge tone="green">Yes · {g.rsvp_count}</Badge>}
                    {g.rsvp_status === "no" && <Badge tone="red">No</Badge>}
                    {g.rsvp_status === "pending" && <Badge tone="amber">Pending</Badge>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => copy(g)} title="Copy link">
                        {copied === g.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </Button>
                      <a
                        className="inline-flex h-8 items-center rounded-lg px-2.5 text-neutral-700 hover:bg-neutral-100"
                        href={`https://t.me/share/url?url=${encodeURIComponent(linkFor(g))}&text=${encodeURIComponent(`សូមគោរពអញ្ជើញ ${g.name}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Share via Telegram"
                      >
                        <Send size={14} />
                      </a>
                      <Button size="sm" variant="ghost" onClick={() => setQrFor(g)} title="QR code">
                        <QrCode size={14} />
                      </Button>
                      <a
                        className="inline-flex h-8 items-center rounded-lg px-2.5 text-neutral-700 hover:bg-neutral-100"
                        href={`/i/${g.code}`}
                        target="_blank"
                        title="Open invitation (counts as an open)"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && <GuestForm guest={editing === "new" ? null : editing} groups={groups} onClose={() => setEditing(null)} />}
      {bulkOpen && <BulkImport onClose={() => setBulkOpen(false)} />}
      {qrFor && <QrModal guest={qrFor} link={linkFor(qrFor)} onClose={() => setQrFor(null)} />}
    </div>
  );
}

function GuestForm({ guest, groups, onClose }: { guest: Guest | null; groups: string[]; onClose: () => void }) {
  const [form, setForm] = useState<GuestInput>({
    name: guest?.name ?? "",
    phone: guest?.phone ?? "",
    group_tag: guest?.group_tag ?? "",
    lang: guest?.lang ?? "kh",
    note: guest?.note ?? "",
  });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof GuestInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const run = (fn: () => ReturnType<typeof createGuest>, close = true) =>
    start(async () => {
      try {
        unwrap(await fn());
        if (close) onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });

  return (
    <Modal open onClose={onClose} title={guest ? "Edit guest" : "Add guest"}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => (guest ? updateGuest(guest.id, form) : createGuest(form)));
        }}
      >
        <Field label="Name (shown on the invitation)">
          <Input value={form.name} onChange={set("name")} required autoFocus placeholder="លោក សុខ សុភា និងភរិយា" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <Input value={form.phone ?? ""} onChange={set("phone")} />
          </Field>
          <Field label="Group">
            <Input value={form.group_tag ?? ""} onChange={set("group_tag")} list="groups" placeholder="Groom side…" />
            <datalist id="groups">
              {["Groom side", "Bride side", "Friends", "Work", ...groups].filter((v, i, a) => a.indexOf(v) === i).map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field label="Default language">
          <Select value={form.lang} onChange={set("lang")}>
            <option value="kh">ខ្មែរ</option>
            <option value="en">English</option>
          </Select>
        </Field>
        <Field label="Note (admin only)">
          <Textarea rows={2} value={form.note ?? ""} onChange={set("note")} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}

        {guest && (
          <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => confirm("Generate a new link? The old link will stop working.") && run(() => regenerateGuestCode(guest.id))}
            >
              <RefreshCw size={14} /> New link
            </Button>
            {guest.rsvp_status !== "pending" && (
              <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => resetGuestRsvp(guest.id))}>
                Reset RSVP
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-red-600"
              disabled={pending}
              onClick={() => confirm(`Delete ${guest.name}?`) && run(() => deleteGuests([guest.id]))}
            >
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function BulkImport({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [group, setGroup] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const rows = useMemo<GuestInput[]>(() => {
    const parsed = parseCsv(text);
    // Skip a header row if present
    if (parsed[0]?.[0]?.toLowerCase() === "name") parsed.shift();
    return parsed.map(([name, phone, group_tag, lang]) => ({
      name,
      phone: phone || null,
      group_tag: group_tag || group || null,
      lang: lang === "en" ? "en" : "kh",
    }));
  }, [text, group]);

  return (
    <Modal open onClose={onClose} title="Bulk add guests">
      <div className="space-y-3">
        <p className="text-sm text-neutral-600">
          One guest per line. Optional columns, comma-separated: <code className="rounded bg-neutral-100 px-1">name, phone, group, lang</code>
        </p>
        <Textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"លោក សុខ សុភា និងភរិយា\nកញ្ញា ចាន់ ធីតា, 012345678, Friends\nJohn Smith, , Work, en"}
        />
        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-rose-600 hover:underline">
            <Upload size={14} /> Load CSV file
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setText(await f.text());
              }}
            />
          </label>
        </div>
        <Field label="Default group (for lines without one)">
          <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="e.g. Bride side" />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-neutral-500">{rows.length} guest(s)</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={pending || rows.length === 0}
              onClick={() =>
                start(async () => {
                  try {
                    unwrap(await bulkCreateGuests(rows));
                    onClose();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Failed");
                  }
                })
              }
            >
              {pending ? "Adding…" : `Add ${rows.length}`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function QrModal({ guest, link, onClose }: { guest: Guest; link: string; onClose: () => void }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(link, { width: 600, margin: 2 }).then(setSrc);
  }, [link]);
  return (
    <Modal open onClose={onClose} title={guest.name}>
      <div className="space-y-3 text-center">
        {src && <img src={src} alt="QR code" className="mx-auto w-64" />}
        <p className="break-all text-xs text-neutral-500">{link}</p>
        <a href={src} download={`invite-${guest.code}.png`}>
          <Button className="mt-2">
            <Download size={16} /> Download PNG
          </Button>
        </a>
      </div>
    </Modal>
  );
}
