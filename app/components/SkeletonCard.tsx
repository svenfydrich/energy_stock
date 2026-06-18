export function SkeletonCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="card p-5 flex flex-col gap-4 h-full animate-pulse">
      <div className="rounded-xl bg-neutral-800 h-64" />
      <div className="h-6 w-3/4 rounded bg-neutral-800" />
      {!compact && (
        <>
          <div className="h-4 w-1/2 rounded bg-neutral-800" />
          <div className="mt-auto h-10 w-full rounded bg-neutral-800" />
        </>
      )}
    </div>
  );
}
