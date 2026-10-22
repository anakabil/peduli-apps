// Hanya di halaman tanpa aksi formulir: loading.tsx global menahan router.refresh() setelah server action
// Kerangka pemuatan saat berpindah halaman di dalam kerangka aplikasi
export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Memuat halaman...</span>

      <div className="mb-6 space-y-2.5" aria-hidden>
        <div className="skeleton h-3.5 w-28 rounded-full" />
        <div className="skeleton h-8 w-64 max-w-full rounded-lg" />
        <div className="skeleton h-4 w-[28rem] max-w-full rounded-md" />
      </div>

      <div className="space-y-2.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card flex gap-3 p-3 md:p-4">
            <div className="skeleton h-16 w-16 shrink-0 rounded-xl md:h-20 md:w-20" />
            <div className="min-w-0 flex-1 space-y-2.5 py-1">
              <div className="flex items-center justify-between gap-3">
                <div className="skeleton h-3 w-24 rounded-full" />
                <div className="skeleton h-5 w-28 rounded-full" />
              </div>
              <div className="skeleton h-3.5 w-11/12 rounded-md" />
              <div className="skeleton h-3.5 w-2/3 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
