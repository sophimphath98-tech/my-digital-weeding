export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-900">
      <div className="flex min-h-dvh w-full max-w-[480px] items-center justify-center bg-gradient-to-b from-[#fffaf2] to-rose-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-300 border-t-transparent" />
      </div>
    </div>
  );
}
