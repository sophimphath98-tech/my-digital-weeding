import { Card } from "@/components/admin/ui";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-56 rounded-lg bg-neutral-200" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="h-24">
            <span />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-64">
          <span />
        </Card>
        <Card className="h-64">
          <span />
        </Card>
      </div>
    </div>
  );
}
