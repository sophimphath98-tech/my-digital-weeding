# Teabkar Digital — ធៀបការឌីជីថល

A personal digital wedding invitation. Each guest gets a unique link (`/i/<code>`) that greets them by name. One admin dashboard manages guests, RSVPs, and wishes, and lets you customize the invitation.

**Stack:** Next.js 15 (App Router) · Tailwind CSS v4 · Supabase (Postgres + Storage) · Framer Motion

## Features

**Guest page** `/i/<code>`
- Envelope-style cover with the guest's name, then an open animation and background music
- Invitation text, countdown, agenda (multiple days), photo gallery with lightbox, map, RSVP, wishes, KHQR gift, and gratitude
- Khmer / English switch (defaults to the guest's language; `?lang=en` overrides it)
- Per-guest share preview (title "អាពាហ៍ពិពាហ៍ …", description "សូមគោរពអញ្ជើញ {name}", cover image)
- Unknown code → 404

**Admin** `/admin` (one password)
- **Dashboard**: guests, opened, attending/declined/pending, total attendees, recent opens, latest wishes
- **Guests**: add, edit, delete, bulk paste or CSV import, search and filters, copy link, share to Telegram, download QR code, export CSV, regenerate link, reset RSVP
- **Customize**: couple and date, KH/EN text, agenda, theme (colors, Khmer/English fonts, size, radius), media uploads (backgrounds, gallery, music, map), gift (KHQR USD/KHR plus account), section toggles, live phone preview
- **Wishes**: hide/show or delete

## Local development

Requires Node 20+, Docker, and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
npm install
supabase start          # applies supabase/migrations + supabase/seed.sql
cp .env.example .env.local
# fill .env.local with the API URL + service_role key printed by `supabase status`
npm run dev
```

- Admin: http://localhost:3000/admin (password = `ADMIN_PASSWORD`)
- Demo guest: http://localhost:3000/i/demo2026
- `supabase db reset` wipes the local database and re-seeds it.

## Deploy (Supabase Cloud + Vercel)

1. Create a project at [supabase.com](https://supabase.com) (pick the **Singapore** region to match Vercel's `sin1`).
2. In **SQL Editor**, paste and run `supabase/setup.sql` (all migrations in order), then `supabase/seed.sql` for the default content. Delete the `demo2026` guest afterwards.
   Or with the CLI: `supabase link --project-ref <ref> && supabase db push`.
3. Push this repo to GitHub and import it into [Vercel](https://vercel.com) (framework: Next.js, no build settings to change).
4. In Vercel → Settings → Environment Variables, add (for Production *and* Preview):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://abcd1234.supabase.co` (Project Settings → Data API) |
   | `SUPABASE_SERVICE_ROLE_KEY` | the `service_role` key, or a new-style **secret** key `sb_secret_…` (Project Settings → API Keys). Keep it secret. |
   | `ADMIN_PASSWORD` | your admin password (use a long one) |
   | `SESSION_SECRET` | 32+ random characters: `openssl rand -base64 32` |
   | `NEXT_PUBLIC_SITE_URL` | your final domain, e.g. `https://your-wedding.vercel.app` (used for guest links and share previews; optional, falls back to the Vercel URL) |

5. **Redeploy** after adding or changing variables (Deployments → ⋯ → Redeploy); `NEXT_PUBLIC_*` values are baked in at build time.
6. Open `/admin`, customize the invitation, and add guests.

### Troubleshooting

- **"Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"** → env vars not set for that environment, or you didn't redeploy.
- **"permission denied for table …"** → run `supabase/migrations/0003_grants.sql` (included in `setup.sql`).
- **"relation … does not exist" / "Could not find the function"** → the SQL wasn't run on this project.
- **Login says "Server misconfigured (SESSION_SECRET)"** → `SESSION_SECRET` is missing or shorter than 16 characters.
- **Uploads fail** → check the `media` bucket exists in Storage (created by the migration) and the file is under 15 MB.

## Security notes

- Every database read and write goes through server code using the service-role key. RLS is enabled with no public policies, so the anon key gives no access.
- Guest codes are 8 random characters (about 47 bits). A link works as an unguessable token, so treat it like a password-less invite.
- Each guest can post at most 5 wishes (enforced by a database trigger).
- Uploads are admin-only: the server checks the file and hands the browser a one-time signed URL, and the file goes straight to Storage (this avoids Vercel's 4.5 MB request limit). The `media` bucket itself accepts only images and audio (no SVG) up to 15 MB.
- Admin login allows 10 failed attempts per IP every 15 minutes. Sessions last 7 days; to sign out every device, change `SESSION_SECRET`.

## Project layout

```
src/app/i/[code]/          guest invitation page
src/app/admin/login/       admin login
src/app/admin/(panel)/     dashboard, guests, customize, wishes
src/app/admin/preview/     admin-only preview with a sample guest
src/app/actions/           server actions (guest.ts = public, admin.ts = guarded)
src/components/invite/     invitation sections
src/components/admin/      admin UI
src/lib/                   supabase client, auth/session, types (zod), data loaders
supabase/                  migration + seed
```
