"use client";

export default function InviteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-900">
      <div className="flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#fffaf2] to-rose-50 px-6 text-center">
        <p className="text-neutral-700">មានបញ្ហា សូមព្យាយាមម្តងទៀត។</p>
        <p className="text-sm text-neutral-500">Something went wrong, please try again.</p>
        <button onClick={reset} className="rounded-lg bg-rose-600 px-5 py-2 text-sm text-white">
          ព្យាយាមម្តងទៀត · Try again
        </button>
      </div>
    </div>
  );
}
