export function TipsSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl glass-strong p-6">
      <div className="pointer-events-none absolute inset-0 rounded-3xl border-l-[3px] border-t-[3px] border-sky-300/60" />
      <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{background:"linear-gradient(135deg, rgba(186,230,253,0.25) 0%, transparent 40%)"}} />

      <div className="relative">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Good to know</p>
          <h2 className="mt-1 text-xl font-bold text-stone-900">Tips</h2>
        </div>

        {/* Tip 1: How it works */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-violet-700 mb-3">How it works</h3>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl bg-violet-50/50 p-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-200/60 text-[11px] font-bold text-violet-700">1</span>
              <div>
                <p className="text-xs font-semibold text-stone-800">Browse</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">Search sellers by name or category.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-violet-50/50 p-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-200/60 text-[11px] font-bold text-violet-700">2</span>
              <div>
                <p className="text-xs font-semibold text-stone-800">Order</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">Pick a product, choose delivery or pickup, and place your order.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-violet-50/50 p-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-200/60 text-[11px] font-bold text-violet-700">3</span>
              <div>
                <p className="text-xs font-semibold text-stone-800">Enjoy</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">Pick up or get delivery. Rate your experience to help the community.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-violet-100/60 my-5" />

        {/* Tip 2: Ratings */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-violet-700 mb-3">Ratings</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-start gap-3 rounded-xl bg-violet-50/50 p-3.5">
                <svg className="h-4 w-4 shrink-0 mt-0.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-.95-.24l-3.296-1.882V12m10-2V6a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.003L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2" />
                </svg>
                <p className="text-[11px] leading-relaxed text-stone-600">
                  <span className="font-semibold text-stone-800">Thumbs up or down</span> — simple and honest. Leave a comment to help sellers improve.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-violet-50/50 p-3.5">
                <svg className="h-4 w-4 shrink-0 mt-0.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p className="text-[11px] leading-relaxed text-stone-600">
                  <span className="font-semibold text-stone-800">Scores improve</span> — when sellers address your feedback, resolved ratings lift their score.
                </p>
              </div>
            </div>
            {/* Score bar demo */}
            <div className="rounded-xl bg-violet-50/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2.5">Score example</p>
              <div className="space-y-2">
                {[
                  { label: "Excellent", score: 94 },
                  { label: "Great", score: 78 },
                  { label: "Good", score: 62 },
                  { label: "Needs work", score: 35 },
                ].map((item) => {
                  const hue = Math.round(item.score * 1.2);
                  const color = `hsl(${hue}, 70%, 45%)`;
                  return (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${item.score}%`, backgroundColor: color }} />
                      </div>
                      <span className="w-6 text-right text-[10px] font-bold" style={{ color }}>{item.score}</span>
                      <span className="w-16 text-[9px] text-stone-400">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
