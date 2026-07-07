import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Gauge,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
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
  const [latestAnalysis, setLatestAnalysis] = useState<SavedAnalysis | null>(null);

  useEffect(() => {
    const history = getAnalysisHistory();
    setLatestAnalysis(history[0] ?? null);
  }, []);

  const handleClearHistory = () => {
    clearAnalysisHistory();
    setLatestAnalysis(null);
  };

  if (!latestAnalysis) {
    return (
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-10 py-12">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#00D97E]">
          Analysis
        </p>

        <h2 className="mt-5 text-4xl font-semibold text-[#F1F5F9]">
          No Active Report
        </h2>

        <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-12 text-center">
          <Sparkles className="mx-auto text-[#00D97E]" size={42} />
          <h3 className="mt-5 text-2xl font-semibold text-[#F1F5F9]">
            Capture a screen to begin
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Your latest Studio PAP design analysis will appear here after you capture
            and analyze a screen.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-10 py-12">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#00D97E]">
            Analysis Report
          </p>

          <h2 className="mt-5 text-4xl font-semibold text-[#F1F5F9]">
            Current Design Review
          </h2>

          <p className="mt-3 max-w-2xl text-slate-400">
            Studio PAP analyzed your latest screen and generated structured design intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-[#00D97E]" />
              {formatDate(latestAnalysis.captured_at)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearHistory}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-4 text-sm font-medium text-red-100 transition hover:bg-red-400/20"
          >
            <Trash2 size={16} aria-hidden="true" />
            Clear History
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-2xl border border-[#00D97E]/20 bg-[#00D97E]/[0.08] p-6 shadow-[0_0_40px_rgba(0,217,126,0.12)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#00D97E]">
            Design Score
          </p>

          <div className="mt-5 flex items-end gap-2">
            <p className="text-7xl font-semibold text-[#F1F5F9]">
              {latestAnalysis.design_score}
            </p>
            <p className="mb-3 text-xl text-slate-400">/100</p>
          </div>

          <p className="mt-5 text-sm text-slate-300">
            Screen type: {latestAnalysis.screen_type}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-panel">
          <div className="flex items-start gap-3">
            <Target size={22} className="mt-1 text-[#00D97E]" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#00D97E]">
                Top Priority
              </p>
              <p className="mt-3 text-base leading-7 text-[#F1F5F9]">
                {latestAnalysis.top_priority}
              </p>
            </div>
          </div>
        </article>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <ScoreCard label="Accessibility" value={latestAnalysis.accessibility_score} />
        <ScoreCard label="Hierarchy" value={latestAnalysis.hierarchy_score} />
        <ScoreCard label="Typography" value={latestAnalysis.typography_score} />
        <ScoreCard label="Spacing" value={latestAnalysis.spacing_score} />
        <ScoreCard label="Color" value={latestAnalysis.color_score} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-panel">
          <div className="flex items-center gap-3">
            <Gauge size={20} className="text-[#00D97E]" />
            <h3 className="text-lg font-semibold text-[#F1F5F9]">Executive Summary</h3>
          </div>

          <p className="mt-4 leading-7 text-slate-300">
            {latestAnalysis.summary}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-panel">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-[#00D97E]" />
            <h3 className="text-lg font-semibold text-[#F1F5F9]">Quick Wins</h3>
          </div>

          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {latestAnalysis.quick_wins.map((win) => (
              <li
                key={win}
                className="flex gap-3 rounded-lg border border-white/10 bg-[#050608]/60 p-3"
              >
                <span className="text-[#00D97E]">✓</span>
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <ArrowUpRight size={20} className="text-[#00D97E]" />
          <h3 className="text-lg font-semibold text-[#F1F5F9]">Design Suggestions</h3>
        </div>

        <ul className="mt-5 space-y-4 text-sm text-slate-300">
          {latestAnalysis.suggestions.map((suggestion) => (
            <li
              key={suggestion}
              className="rounded-xl border border-white/10 bg-[#050608]/60 p-4 leading-6"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      </article>

      <article className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#050608]/70 shadow-panel">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="text-base font-semibold text-[#F1F5F9]">
            Analyzed Screenshot
          </h3>
        </div>

        <img
          src={latestAnalysis.screenshot_data_url}
          alt="Analyzed screenshot"
          className="max-h-[640px] w-full object-contain"
        />
      </article>
    </section>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-panel">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#F1F5F9]">{value}</p>
    </div>
  );
}