import {
  Clock3,
  FileSearch,
  Gauge,
  Sparkles,
} from 'lucide-react';

export function SuggestionsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-10 py-12">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
            AI Analysis History
          </p>

          <h2 className="mt-5 text-4xl font-semibold text-white">
            Previous Reviews
          </h2>

          <p className="mt-3 max-w-2xl text-slate-400">
            Every screen you analyze will appear here with its AI scores,
            quick wins, and recommendations.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <Gauge className="text-emerald-300" size={20} />
            <span className="text-sm text-slate-300">Average Score</span>
          </div>

          <p className="mt-5 text-5xl font-semibold text-white">—</p>

          <p className="mt-2 text-sm text-slate-400">
            Calculated from all analyses.
          </p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <FileSearch className="text-cyan-300" size={20} />
            <span className="text-sm text-slate-300">
              Total Reviews
            </span>
          </div>

          <p className="mt-5 text-5xl font-semibold text-white">0</p>

          <p className="mt-2 text-sm text-slate-400">
            Saved design analyses.
          </p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <Clock3 className="text-violet-300" size={20} />
            <span className="text-sm text-slate-300">
              Last Review
            </span>
          </div>

          <p className="mt-5 text-xl font-semibold text-white">
            —
          </p>

          <p className="mt-2 text-sm text-slate-400">
            No analysis saved yet.
          </p>
        </article>
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-12">
        <div className="flex flex-col items-center text-center">
          <Sparkles
            size={42}
            className="text-cyan-300"
          />

          <h3 className="mt-5 text-2xl font-semibold text-white">
            Your AI Review History
          </h3>

          <p className="mt-3 max-w-xl text-slate-400">
            This page will automatically store every screenshot
            you analyze, including design scores, accessibility,
            hierarchy, typography, spacing, color, quick wins,
            and AI recommendations.
          </p>

          <div className="mt-8 w-full max-w-3xl rounded-xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">
              No analyses yet.
            </p>

            <p className="mt-2 text-slate-500">
              Capture a screen to begin building your design history.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}