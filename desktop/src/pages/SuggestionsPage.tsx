import { exportAnalysisPdf } from "../services/pdfExport";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Download,
  Gauge,
  MessageCircle,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  clearAnalysisHistory,
  getAnalysisHistory,
  type SavedAnalysis,
} from "../services/analysisHistory";

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export function SuggestionsPage() {
  const [latestAnalysis, setLatestAnalysis] =
    useState<SavedAnalysis | null>(null);

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
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-10 py-12 text-[var(--text-primary)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--accent-primary)]">
          Analysis
        </p>

        <h1 className="mt-5 text-4xl font-semibold text-[var(--text-primary)]">
          No Active Report
        </h1>

        <div className="mt-10 rounded-2xl border border-dashed border-[var(--border-primary)] bg-[var(--background-card)] p-12 text-center">
          <Sparkles
            className="mx-auto text-[var(--accent-primary)]"
            size={42}
          />

          <h2 className="mt-5 text-2xl font-semibold text-[var(--text-primary)]">
            Capture a screen to begin
          </h2>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-[var(--text-secondary)]">
            Your latest Studio PAP design analysis will appear
            here after you capture and analyze a screen.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-10 py-12 text-[var(--text-primary)]">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--accent-primary)]">
            Analysis Report
          </p>

          <h1 className="mt-5 text-4xl font-semibold text-[var(--text-primary)]">
            Current Design Review
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-[var(--text-secondary)]">
            Studio PAP analyzed your latest screen and generated
            structured design intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--background-card)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <Clock3
                size={16}
                className="text-[var(--accent-primary)]"
              />

              {formatDate(latestAnalysis.captured_at)}
            </div>
          </div>

          <Link
            to="/live-analysis"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 text-sm font-medium text-[var(--accent-text)] transition hover:bg-[var(--background-soft)]"
          >
            <MessageCircle size={16} aria-hidden="true" />

            Ask Assistant
          </Link>

          <button
            type="button"
            onClick={handleClearHistory}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-4 text-sm font-medium text-red-500 transition hover:bg-red-400/20"
          >
            <Trash2 size={16} aria-hidden="true" />

            Clear History
          </button>

          <button
            type="button"
            onClick={() => {
              void exportAnalysisPdf(latestAnalysis);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-5 text-sm font-semibold text-[var(--button-text)] shadow-[0_0_30px_var(--theme-glow)] transition hover:bg-[var(--accent-hover)]"
          >
            <Download size={16} aria-hidden="true" />

            Export PDF
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5 shadow-[0_0_40px_var(--theme-glow)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-primary)]">
              Want a deeper expert review?
            </p>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Ask Studio PAP Assistant to review this like a
              jeweler, UX designer, merchant, architect, or brand
              strategist depending on what you uploaded.
            </p>
          </div>

          <Link
            to="/live-analysis"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--button-text)] shadow-[0_0_30px_var(--theme-glow)] transition hover:bg-[var(--accent-hover)]"
          >
            <MessageCircle size={16} aria-hidden="true" />

            Go to Assistant
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6 shadow-[0_0_40px_var(--theme-glow)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-primary)]">
            Design Score
          </p>

          <div className="mt-5 flex items-end gap-2">
            <p className="text-7xl font-semibold text-[var(--text-primary)]">
              {latestAnalysis.design_score}
            </p>

            <p className="mb-3 text-xl text-[var(--text-secondary)]">
              /100
            </p>
          </div>

          <p className="mt-5 text-sm text-[var(--text-secondary)]">
            Screen type: {latestAnalysis.screen_type}
          </p>
        </article>

        <article className="rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-6 shadow-panel">
          <div className="flex items-start gap-3">
            <Target
              size={22}
              className="mt-1 shrink-0 text-[var(--accent-primary)]"
            />

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-primary)]">
                Top Priority
              </p>

              <p className="mt-3 text-base leading-7 text-[var(--text-primary)]">
                {latestAnalysis.top_priority}
              </p>
            </div>
          </div>
        </article>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <ScoreCard
          label="Accessibility"
          value={latestAnalysis.accessibility_score}
        />

        <ScoreCard
          label="Hierarchy"
          value={latestAnalysis.hierarchy_score}
        />

        <ScoreCard
          label="Typography"
          value={latestAnalysis.typography_score}
        />

        <ScoreCard
          label="Spacing"
          value={latestAnalysis.spacing_score}
        />

        <ScoreCard
          label="Color"
          value={latestAnalysis.color_score}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-6 shadow-panel">
          <div className="flex items-center gap-3">
            <Gauge
              size={20}
              className="text-[var(--accent-primary)]"
            />

            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Executive Summary
            </h2>
          </div>

          <p className="mt-4 leading-7 text-[var(--text-secondary)]">
            {latestAnalysis.summary}
          </p>
        </article>

        <article className="rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-6 shadow-panel">
          <div className="flex items-center gap-3">
            <CheckCircle2
              size={20}
              className="text-[var(--accent-primary)]"
            />

            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Quick Wins
            </h2>
          </div>

          <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
            {latestAnalysis.quick_wins.map((win, index) => (
              <li
                key={`${win}-${index}`}
                className="flex gap-3 rounded-lg border border-[var(--border-primary)] bg-[var(--background-secondary)] p-3"
              >
                <span className="text-[var(--accent-primary)]">
                  ✓
                </span>

                <span>{win}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="mt-8 rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <ArrowUpRight
            size={20}
            className="text-[var(--accent-primary)]"
          />

          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Design Suggestions
          </h2>
        </div>

        <ul className="mt-5 space-y-4 text-sm text-[var(--text-secondary)]">
          {latestAnalysis.suggestions.map(
            (suggestion, index) => (
              <li
                key={`${suggestion}-${index}`}
                className="rounded-xl border border-[var(--border-primary)] bg-[var(--background-secondary)] p-4 leading-6"
              >
                {suggestion}
              </li>
            ),
          )}
        </ul>
      </article>

      <article className="mt-8 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--background-secondary)] shadow-panel">
        <div className="border-b border-[var(--border-primary)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Analyzed Screenshot
          </h2>
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

function ScoreCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--background-card)] p-4 shadow-panel">
      <p className="text-xs text-[var(--text-secondary)]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}