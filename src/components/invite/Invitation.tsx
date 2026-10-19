"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Music, VolumeX } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackOpen } from "@/app/actions/guest";
import type { EventData, ScheduleDay } from "@/lib/types";
import { Countdown } from "./Countdown";
import { labels, type Lang } from "./i18n";
import { Lightbox } from "./Lightbox";
import { Reveal, SectionTitle } from "./Reveal";
import { Rsvp } from "./Rsvp";
import { Wishes, type PublicWish } from "./Wishes";

export type InviteGuest = {
  code: string;
  name: string;
  lang: Lang;
  rsvp_status: "pending" | "yes" | "no";
  rsvp_count: number;
};

type Props = {
  event: EventData;
  agenda: ScheduleDay[];
  guest: InviteGuest;
  wishes: PublicWish[];
  initialLang: Lang;
  preview?: boolean;
};

// Only Supabase Storage is allowed in next.config images; pasted external URLs are served as-is.
const unoptimized = (src: string) => !src.includes(".supabase.co/storage/v1/object/public/");

function bg(url: string, fallback: string) {
  // Percent-encode characters that would end the CSS string early (pasted URLs aren't sanitised).
  const safe = url.replace(/["\\\n\r]/g, encodeURIComponent);
  return url ? { backgroundImage: `url("${safe}")` } : { background: fallback };
}

export function Invitation({ event, agenda, guest, wishes, initialLang, preview = false }: Props) {
  const { config: c, sections } = event;
  const [lang, setLang] = useState<Lang>(initialLang);
  const [opened, setOpened] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const tracked = useRef(false);

  const t = labels[lang];
  const text = lang === "kh" ? event.text_kh : event.text_en;

  useEffect(() => {
    if (preview || tracked.current) return;
    tracked.current = true;
    trackOpen(guest.code).catch(() => {});
  }, [guest.code, preview]);

  const themeVars = useMemo(
    () =>
      ({
        "--primary": c.primaryColor,
        "--text": c.textColor,
        "--guest": c.guestNameColor,
        "--radius": `${c.borderRadius}px`,
        "--font-title": lang === "kh" ? `"${c.fontKh}"` : `"${c.fontEn}"`,
        "--font-heading": lang === "kh" ? `"${c.fontKh}"` : `"Ovo"`,
        "--font-body": lang === "kh" ? `"${c.fontBodyKh}"` : `"Ovo"`,
        "--font-script": `"${c.fontEn}"`,
        fontSize: `${c.fontSize}px`,
      }) as React.CSSProperties,
    [c, lang],
  );

  const open = () => {
    setOpened(true);
    if (audio.current && c.music) {
      audio.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const toggleMusic = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => {});
    else {
      a.pause();
      setPlaying(false);
    }
  };

  const gradient = `linear-gradient(160deg, #fffaf2, color-mix(in srgb, ${c.primaryColor} 25%, #fff))`;

  return (
    <div className="invite min-h-dvh bg-neutral-900" style={themeVars}>
      {c.music && <audio ref={audio} src={c.music} loop preload="none" />}

      <div className="relative mx-auto min-h-dvh max-w-[480px] overflow-hidden bg-white shadow-2xl">
        {/* ---------- Cover ---------- */}
        <AnimatePresence>
          {!opened && (
            <motion.section
              key="cover"
              className="fixed inset-0 z-40 mx-auto flex max-w-[480px] flex-col items-center justify-between bg-cover bg-center px-6 py-16 text-center"
              style={bg(c.coverBackground, gradient)}
              exit={{ opacity: 0, scale: 1.08, filter: "blur(6px)" }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
            >
              <div className="space-y-3">
                <p className="font-title text-lg" style={{ color: "var(--primary)" }}>
                  {text.main_title}
                </p>
                <p className="font-title text-2xl leading-loose">
                  {event.groom}
                  <span className="font-script mx-3 text-3xl" style={{ color: "var(--primary)" }}>
                    &amp;
                  </span>
                  {event.bride}
                </p>
              </div>

              <div className="w-full space-y-4">
                <p className="text-sm">{text.subtitle || t.dear}</p>
                <div className="card mx-auto w-full max-w-xs px-4 py-3">
                  <p className="font-title text-lg" style={{ color: "var(--guest)" }}>
                    {guest.name}
                  </p>
                </div>
                <motion.button
                  onClick={open}
                  className="btn-primary mx-auto px-8 py-3 shadow-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {t.open}
                </motion.button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ---------- Floating controls ---------- */}
        {opened && (
          <div className="fixed bottom-5 z-30 flex w-full max-w-[480px] justify-end gap-2 px-4 pointer-events-none">
            <button
              onClick={() => setLang(lang === "kh" ? "en" : "kh")}
              className="btn-primary pointer-events-auto h-11 w-11 rounded-full! text-xs font-bold shadow-lg"
              aria-label="Switch language"
            >
              {lang === "kh" ? "EN" : "ខ្មែរ"}
            </button>
            {c.music && (
              <button
                onClick={toggleMusic}
                className="btn-primary pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full! shadow-lg"
                aria-label="Toggle music"
              >
                {playing ? <Music size={18} className="animate-spin [animation-duration:3s]" /> : <VolumeX size={18} />}
              </button>
            )}
          </div>
        )}

        <Petals color={c.primaryColor} />

        {/* ---------- Main ---------- */}
        <section className="relative bg-cover bg-center px-6 py-16 text-center" style={bg(c.mainBackground, gradient)}>
          <Reveal className="space-y-5">
            <p className="font-title text-2xl leading-loose" style={{ color: "var(--primary)" }}>
              {text.main_title}
            </p>
            <p className="font-title text-xl leading-loose">
              {event.groom}
              <span className="font-script mx-3 text-3xl" style={{ color: "var(--primary)" }}>
                &amp;
              </span>
              {event.bride}
            </p>
            <div className="divider mx-auto w-48" />
            <p className="text-sm">{text.subtitle}</p>
            <p className="font-title text-lg" style={{ color: "var(--guest)" }}>
              {guest.name}
            </p>
          </Reveal>

          <Reveal className="card mt-8 space-y-4 p-5" delay={0.1}>
            <p className="font-heading text-base leading-relaxed" style={{ color: "var(--primary)" }}>
              {text.invitation_title}
            </p>
            <p className="whitespace-pre-line text-sm leading-7">{text.invitation_message}</p>
            <div className="divider" />
            <p className="text-sm font-semibold leading-7">{text.date_time}</p>
            <p className="flex items-start justify-center gap-1 text-sm leading-7">
              <MapPin size={16} className="mt-1.5 shrink-0" style={{ color: "var(--primary)" }} />
              {text.location}
            </p>
          </Reveal>
        </section>

        {/* ---------- Countdown ---------- */}
        {sections.countdown && event.event_date && (
          <section className="px-6 py-12" style={{ background: gradient }}>
            <Reveal>
              <SectionTitle>{t.countdown}</SectionTitle>
              <Countdown date={event.event_date} t={t} />
            </Reveal>
          </section>
        )}

        {/* ---------- Agenda ---------- */}
        {sections.agenda && agenda.length > 0 && (
          <section className="bg-cover bg-center px-6 py-14" style={bg(c.detailsBackground, gradient)}>
            <Reveal>
              <SectionTitle>{text.details_title}</SectionTitle>
            </Reveal>
            <div className="space-y-6">
              {agenda.map((day) => (
                <Reveal key={day.id} className="card p-5">
                  <p className="font-heading mb-4 text-center text-base leading-relaxed" style={{ color: "var(--primary)" }}>
                    {day.title}
                  </p>
                  <ol className="relative ml-2 space-y-4 border-l pl-5" style={{ borderColor: "var(--primary)" }}>
                    {day.items.map((it) => (
                      <li key={it.id} className="relative">
                        <span
                          className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white"
                          style={{ background: "var(--primary)" }}
                        />
                        <p className="text-xs font-semibold tabular-nums opacity-80">{it.time}</p>
                        <p className="text-sm">{it.name}</p>
                      </li>
                    ))}
                  </ol>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ---------- Gallery ---------- */}
        {sections.gallery && c.gallery.length > 0 && (
          <section className="px-4 py-14" style={{ background: gradient }}>
            <Reveal>
              <SectionTitle>{t.gallery}</SectionTitle>
            </Reveal>
            <div className="grid grid-cols-2 gap-2">
              {c.gallery.map((src, i) => {
                // Every 3rd photo is full width; a trailing photo left alone in its row is too.
                const wide = i % 3 === 0 || (i % 3 === 1 && i === c.gallery.length - 1);
                return (
                <Reveal key={src + i} delay={(i % 2) * 0.08} className={wide ? "col-span-2" : ""}>
                  <button onClick={() => setZoom(src)} className="block w-full overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
                    <Image
                      src={src}
                      alt=""
                      unoptimized={unoptimized(src)}
                      width={wide ? 960 : 480}
                      height={wide ? 720 : 640}
                      sizes={wide ? "(max-width: 480px) 100vw, 480px" : "(max-width: 480px) 50vw, 240px"}
                      className={`w-full object-cover transition duration-500 hover:scale-105 ${wide ? "aspect-[4/3]" : "aspect-[3/4]"}`}
                    />
                  </button>
                </Reveal>
                );
              })}
            </div>
          </section>
        )}

        {/* ---------- Location ---------- */}
        {sections.map && (c.mapUrl || c.mapImage) && (
          <section className="px-6 py-14">
            <Reveal>
              <SectionTitle>{t.location}</SectionTitle>
              <div className="card overflow-hidden">
                {c.mapImage && <Image src={c.mapImage} alt="map" unoptimized={unoptimized(c.mapImage)} width={960} height={640} sizes="(max-width: 480px) 100vw, 480px" className="h-auto w-full object-cover" />}
                <div className="space-y-3 p-4 text-center">
                  <p className="text-sm leading-7">{text.location}</p>
                  {c.mapUrl && (
                    <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2 px-5 py-2 text-sm">
                      <MapPin size={16} /> {t.openMap}
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* ---------- RSVP ---------- */}
        {sections.rsvp && (
          <section className="px-6 py-12" style={{ background: gradient }}>
            <Reveal>
              <SectionTitle>{t.rsvp}</SectionTitle>
              <Rsvp code={guest.code} initialStatus={guest.rsvp_status} initialCount={guest.rsvp_count} preview={preview} t={t} />
            </Reveal>
          </section>
        )}

        {/* ---------- Wishes ---------- */}
        {sections.wishes && (
          <section className="px-6 py-12">
            <Reveal>
              <SectionTitle>{t.wishes}</SectionTitle>
              <Wishes code={guest.code} initial={wishes} preview={preview} t={t} />
            </Reveal>
          </section>
        )}

        {/* ---------- Gift ---------- */}
        {sections.gift && (c.qrUsd || c.qrKhr) && (
          <section className="px-6 py-12" style={{ background: gradient }}>
            <Reveal>
              <SectionTitle>{t.gift}</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["USD", c.qrUsd],
                  ["KHR", c.qrKhr],
                ]
                  .filter(([, src]) => src)
                  .map(([cur, src]) => (
                    <button key={cur} onClick={() => setZoom(src)} className="card p-3 text-center">
                      <img src={src} alt={`KHQR ${cur}`} className="mx-auto aspect-square w-full object-contain" />
                      <p className="mt-2 text-sm font-semibold">{cur}</p>
                    </button>
                  ))}
              </div>
              {(c.accountName || c.accountNumber) && (
                <div className="card mt-3 p-3 text-center text-sm">
                  {c.bankName && <p className="font-semibold">{c.bankName}</p>}
                  {c.accountName && <p>{c.accountName}</p>}
                  {c.accountNumber && <p className="tabular-nums">{c.accountNumber}</p>}
                </div>
              )}
              <p className="mt-2 text-center text-xs opacity-70">{t.giftNote}</p>
            </Reveal>
          </section>
        )}

        {/* ---------- Gratitude ---------- */}
        <section className="bg-cover bg-center px-6 pb-28 pt-14 text-center" style={bg(c.mainBackground, gradient)}>
          <Reveal className="card space-y-4 p-6">
            <p className="font-heading text-base leading-relaxed" style={{ color: "var(--primary)" }}>
              {text.gratitude_title}
            </p>
            <p className="whitespace-pre-line text-sm leading-7">{text.gratitude_message}</p>
            <div className="divider" />
            <p className="font-title text-lg leading-loose">
              {event.groom} <span className="font-script text-2xl" style={{ color: "var(--primary)" }}>&amp;</span> {event.bride}
            </p>
          </Reveal>
        </section>
      </div>

      <Lightbox src={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}

function Petals({ color }: { color: string }) {
  // Deterministic positions so server and client render the same markup.
  const petals = Array.from({ length: 10 }, (_, i) => ({
    left: (i * 37) % 100,
    size: 8 + ((i * 7) % 8),
    duration: 12 + ((i * 5) % 10),
    delay: (i * 1.7) % 12,
  }));
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20 mx-auto max-w-[480px] overflow-hidden">
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal absolute -bottom-6 rounded-[50%_0_50%_0] opacity-70"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
