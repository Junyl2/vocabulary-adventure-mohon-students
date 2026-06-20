export function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex justify-between gap-4 text-sm font-black text-slate-700">
        <span>{label}</span>
        <span>{value} of {total}</span>
      </div>
      <div className="h-5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
