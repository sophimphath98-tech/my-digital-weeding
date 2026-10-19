"use client";

import { ImagePlus, Loader2, Music, X } from "lucide-react";
import { useRef, useState } from "react";
import { createUpload } from "@/app/actions/admin";
import { unwrap } from "@/lib/action-result";

/** Uploads straight to Supabase Storage via a signed URL; returns the file's public URL. */
export async function uploadFile(file: File) {
  const { uploadUrl, publicUrl } = unwrap(await createUpload({ name: file.name, type: file.type, size: file.size }));
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type, "cache-control": "max-age=31536000", "x-upsert": "false" },
    body: file,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Upload failed (${res.status})`);
  }
  return publicUrl;
}

export function MediaUpload({
  label,
  value,
  onChange,
  kind = "image",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: "image" | "audio";
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 hover:border-rose-400"
        >
          {busy ? (
            <Loader2 className="animate-spin" size={20} />
          ) : value && kind === "image" ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : kind === "audio" ? (
            <Music size={20} className={value ? "text-rose-500" : ""} />
          ) : (
            <ImagePlus size={20} />
          )}
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          {kind === "audio" && value && <audio src={value} controls className="h-8 w-full" />}
          <input
            className="h-8 w-full rounded-md border border-neutral-200 px-2 text-xs text-neutral-600"
            placeholder="…or paste a URL"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {value && (
            <button type="button" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-600" onClick={() => onChange("")}>
              <X size={12} /> Remove
            </button>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        hidden
        accept={kind === "image" ? "image/*" : "audio/*"}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          setError("");
          try {
            onChange(await uploadFile(f));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

export function GalleryEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");

  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-neutral-700">Gallery photos</span>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((src, i) => (
          <div key={src + i} className="group relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 text-xs text-white opacity-0 transition group-hover:opacity-100 max-sm:opacity-100">
              <button type="button" onClick={() => move(i, -1)} aria-label="Move left">
                ◀
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Remove">
                ✕
              </button>
              <button type="button" onClick={() => move(i, 1)} aria-label="Move right">
                ▶
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-neutral-300 text-neutral-400 hover:border-rose-400"
        >
          {busy ? <Loader2 className="animate-spin" size={20} /> : <ImagePlus size={20} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input
        ref={input}
        type="file"
        hidden
        multiple
        accept="image/*"
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (!files.length) return;
          setBusy(files.length);
          setError("");
          // Keep whatever finished uploading even if a later file fails.
          const urls: string[] = [];
          try {
            for (const f of files) urls.push(await uploadFile(f));
          } catch (err) {
            const failed = files[urls.length]?.name;
            setError(`${failed ? `${failed}: ` : ""}${err instanceof Error ? err.message : "Upload failed"}`);
          } finally {
            if (urls.length) onChange([...value, ...urls]);
            setBusy(0);
          }
        }}
      />
    </div>
  );
}
