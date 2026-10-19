import { CustomizeEditor } from "@/components/admin/CustomizeEditor";
import { getAgenda, getEvent } from "@/lib/event";

export const dynamic = "force-dynamic";

export default async function CustomizePage() {
  const [event, agenda] = await Promise.all([getEvent(), getAgenda()]);
  return <CustomizeEditor initial={event} agenda={agenda} />;
}
