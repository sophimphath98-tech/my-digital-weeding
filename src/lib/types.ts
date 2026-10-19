import { z } from "zod";

export const eventConfigSchema = z.object({
  primaryColor: z.string().default("#f9af59"),
  textColor: z.string().default("#B08E4F"),
  guestNameColor: z.string().default("#364153"),
  fontKh: z.string().default("Moul"),
  fontBodyKh: z.string().default("Battambang"),
  fontEn: z.string().default("Great Vibes"),
  fontSize: z.coerce.number().default(16),
  borderRadius: z.coerce.number().default(8),
  coverBackground: z.string().default(""),
  mainBackground: z.string().default(""),
  detailsBackground: z.string().default(""),
  music: z.string().default(""),
  mapUrl: z.string().default(""),
  mapImage: z.string().default(""),
  qrUsd: z.string().default(""),
  qrKhr: z.string().default(""),
  bankName: z.string().default(""),
  accountName: z.string().default(""),
  accountNumber: z.string().default(""),
  gallery: z.array(z.string()).default([]),
});
export type EventConfig = z.infer<typeof eventConfigSchema>;

export const invitationTextSchema = z.object({
  main_title: z.string().default(""),
  subtitle: z.string().default(""),
  invitation_title: z.string().default(""),
  invitation_message: z.string().default(""),
  date_time: z.string().default(""),
  location: z.string().default(""),
  details_title: z.string().default(""),
  gratitude_title: z.string().default(""),
  gratitude_message: z.string().default(""),
});
export type InvitationText = z.infer<typeof invitationTextSchema>;
export const TEXT_FIELDS = Object.keys(invitationTextSchema.shape) as (keyof InvitationText)[];

export const sectionsSchema = z.object({
  countdown: z.boolean().default(true),
  agenda: z.boolean().default(true),
  gallery: z.boolean().default(true),
  map: z.boolean().default(true),
  rsvp: z.boolean().default(true),
  wishes: z.boolean().default(true),
  gift: z.boolean().default(true),
});
export type Sections = z.infer<typeof sectionsSchema>;
export const SECTION_KEYS = Object.keys(sectionsSchema.shape) as (keyof Sections)[];

export type EventData = {
  groom: string;
  bride: string;
  event_date: string | null;
  config: EventConfig;
  text_kh: InvitationText;
  text_en: InvitationText;
  sections: Sections;
};

export type TimelineItem = { id: string; day_id: string; time: string; name: string; sort: number };
export type ScheduleDay = { id: string; title: string; date: string | null; sort: number; items: TimelineItem[] };

export type Guest = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  group_tag: string | null;
  lang: "kh" | "en";
  note: string | null;
  opened_at: string | null;
  open_count: number;
  rsvp_status: "pending" | "yes" | "no";
  rsvp_count: number;
  rsvp_at: string | null;
  created_at: string;
};

export type Wish = {
  id: string;
  guest_id: string;
  message: string;
  approved: boolean;
  created_at: string;
  guest?: { name: string } | null;
};

export const KH_FONTS = ["Moul", "Moulpali", "Battambang", "Kantumruy Pro", "Dangrek", "Fasthand", "Noto Sans Khmer", "Bayon", "Koulen"];
export const EN_FONTS = ["Great Vibes", "Dancing Script", "Pacifico", "Norican", "Ovo", "Montserrat", "Playfair Display", "Cormorant Garamond"];
