import { Clock3, FileSearch, Gauge, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  clearAnalysisHistory,
  getAnalysisHistory,
  type SavedAnalysis,
} from '../services/analysisHistory';

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export function SuggestionsPage() {
  const [history, setHistory] = useState<SavedAnalysis[]>([]);

  useEffect(() => {
    setHistory(getAnalysisHistory());
  }, []);

  const averageScore =
    history.length > 0
      ? Math.round(
          history.reduce((total, item) => total + item.design_score, 0) /
            history.length,
        )
      : null;

  const handleClearHistory = () => {
    clearAnalysisHistory();
    setHistory([]);
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-10 py-12">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
            AI Analysis History
          </p>

          <h2 className="mt-5 text-4xl font-semibold text-white">
            Previous Reviews
          </h2>

          <p className="mt-3 max-w-2xl text-slate-400">
            Every screen you analyze appears here with its AI scores, quick wins,
            and recommendations.
          </p>
        </div>

        {history.length > 0 ? (
          <button
            type="button"
            onClick={handleClearHistory}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-4 text-sm font-medium text-red-100 transition hover:bg-red-400/20"
          >
            <Trash2 size={16} aria-hidden="true" />
            Clear History
          </button>
        ) : null}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <Gauge className="text-emerald-300" size={20} />
            <span className="text-sm text-slate-300">Average Score</span>
          </div>

          <p className="mt-5 text-5xl font-semibold text-white">
            {averageScore ?? '—'}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Calculated from saved analyses.
          </p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <FileSearch className="text-cyan-300" size={20} />
            <span className="text-sm text-slate-300">Total Reviews</span>
          </div>

          <p className="mt-5 text-5xl font-semibold text-white">
            {history.length}
          </p>

          <p className="mt-2 text-sm text-slate-400">Saved design analyses.</p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <Clock3 className="text-violet-300" size={20} />
            <span className="text-sm text-slate-300">Last Review</span>
          </div>

          <p className="mt-5 text-xl font-semibold text-white">
            {history[0] ? formatDate(history[0].captured_at) : '—'}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            {history[0] ? history[0].screen_type : 'No analysis saved yet.'}
          </p>
        </article>
      </div>

      {history.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-12">
          <div className="flex flex-col items-center text-center">
            <Sparkles size={42} className="text-cyan-300" />

            <h3 className="mt-5 text-2xl font-semibold text-white">
              Your AI Review History
            </h3>

            <p className="mt-3 max-w-xl text-slate-400">
              Capture a screen to begin building your design history.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-10 space-y-5">
          {history.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-panel"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                    {item.screen_type}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Design Review
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {formatDate(item.captured_at)}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">
                    Score
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {item.design_score}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-5">
                <Score label="Accessibility" value={item.accessibility_score} />
                <Score label="Hierarchy" value={item.hierarchy_score} />
                <Score label="Typography" value={item.typography_score} />
                <Score label="Spacing" value={item.spacing_score} />
                <Score label="Color" value={item.color_score} />
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-300">
                {item.summary}
              </p>

              <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">Top Priority</p>
                <p className="mt-2 text-sm text-slate-300">
                  {item.top_priority}
                </p>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Quick Wins
                  </h4>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    {item.quick_wins.map((win) => (
                      <li key={win} className="flex gap-2">
                        <span className="text-emerald-300">✓</span>
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Suggestions
                  </h4>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    {item.suggestions.slice(0, 3).map((suggestion) => (
                      <li key={suggestion} className="flex gap-2">
                        <span className="text-cyan-300">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60">
                <img
                  src={item.screenshot_data_url}
                  alt="Saved analysis screenshot"
                  className="max-h-[360px] w-full object-contain"
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}