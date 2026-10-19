import { FontLinks } from "@/components/invite/FontLinks";
import { Invitation } from "@/components/invite/Invitation";
import { requireAdmin } from "@/lib/auth";
import { getAgenda, getApprovedWishes, getEvent } from "@/lib/event";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview", robots: { index: false } };

/** Admin-only preview with a sample guest. Nothing is tracked or saved. */
export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  await requireAdmin();
  const { lang } = await searchParams;
  const [event, agenda, wishes] = await Promise.all([getEvent(), getAgenda(), getApprovedWishes()]);
  return (
    <>
      <FontLinks config={event.config} />
      <Invitation
        preview
        event={event}
        agenda={agenda}
        wishes={event.sections.wishes ? wishes : []}
        initialLang={lang === "en" ? "en" : "kh"}
        guest={{ code: "preview", name: "ឈ្មោះភ្ញៀវកិត្តិយស", lang: "kh", rsvp_status: "pending", rsvp_count: 0 }}
      />
    </>
  );
}
