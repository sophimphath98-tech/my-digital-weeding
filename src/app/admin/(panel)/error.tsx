"use client";

import { Button, Card } from "@/components/admin/ui";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto max-w-md space-y-3 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-neutral-500">
        The page couldn&apos;t load. Try again, and if it keeps happening check the server logs
        {error.digest && <> (reference {error.digest})</>}.
      </p>
      <Button onClick={reset}>Try again</Button>
    </Card>
  );
}
