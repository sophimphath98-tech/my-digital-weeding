"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/admin";
import { Button, Card, Input } from "@/components/admin/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <main className="flex min-h-dvh items-center justify-center bg-rose-50 p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Teabkar Admin</h1>
        <p className="mb-5 text-sm text-neutral-500">ចូលគ្រប់គ្រងធៀបការ</p>
        <form action={action} className="space-y-3">
          <Input name="password" type="password" placeholder="Password" autoFocus required />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
