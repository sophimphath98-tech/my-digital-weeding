import { WishList } from "@/components/admin/WishList";
import { listWishes } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function WishesPage() {
  const wishes = await listWishes();
  return <WishList wishes={wishes} />;
}
