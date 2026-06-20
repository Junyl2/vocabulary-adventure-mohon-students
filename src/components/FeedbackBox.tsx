export function FeedbackBox({ message, tone = 'info' }: { message: string; tone?: 'info' | 'good' | 'try' }) {
  const colors = {
    info: 'border-sky-300 bg-sky-100 text-sky-950',
    good: 'border-emerald-300 bg-emerald-100 text-emerald-950',
    try: 'border-amber-300 bg-amber-100 text-amber-950',
  };
  return <div className={`rounded-3xl border-4 p-4 text-lg font-black ${colors[tone]}`}>{message}</div>;
}
