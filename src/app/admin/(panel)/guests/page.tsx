import { GuestManager } from "@/components/admin/GuestManager";
import { listGuests } from "@/lib/admin-data";
import { configuredSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const guests = await listGuests();
  return <GuestManager guests={guests} siteUrl={configuredSiteUrl()} />;
}
