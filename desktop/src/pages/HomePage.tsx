import {
  Activity,
  Camera,
  CheckCircle2,
  Gauge,
  History,
  RefreshCw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useBackendStatus } from '../hooks/useBackendStatus';

function getStatusLabel(status: string): string {
  if (status === 'connected') return 'Connected';
  if (status === 'offline') return 'Offline';
  if (status === 'checking') return 'Checking...';
  return 'Not Checked';
}

export function HomePage() {
  const { status, lastCheckedAt, checkBackend } = useBackendStatus();

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-10 py-12">
      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] p-8 shadow-panel">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-300">
              AI Design Copilot
            </p>
            <h2 className="mt-5 text-5xl font-semibold text-white">Ghost Designer</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Capture any screen, analyze it with AI vision, and get structured design
              scores, quick wins, and senior-level UX feedback.
            </p>

            <div className="mt-7 flex gap-3">
              <Link
                to="/screen-capture"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-200"
              >
                <Camera size={17} aria-hidden="true" />
                Analyze Screen
              </Link>

              <button
                type="button"
                onClick={checkBackend}
                disabled={status === 'checking'}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCw
                  size={17}
                  aria-hidden="true"
                  className={status === 'checking' ? 'animate-spin' : ''}
                />
                Check Backend
              </button>
            </div>
          </div>

          <div className="min-w-[190px] rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Latest Score
            </p>
            <p className="mt-4 text-6xl font-semibold text-white">—</p>
            <p className="mt-3 text-sm text-slate-400">
              Analyze a screen to generate your first score.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5 shadow-panel">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Activity size={18} aria-hidden="true" className="text-cyan-300" />
            <span>Backend</span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-white">{getStatusLabel(status)}</p>
          <p className="mt-2 text-sm text-slate-400">
            {lastCheckedAt
              ? `Last checked ${lastCheckedAt.toLocaleTimeString()}`
              : 'Ready to check FastAPI.'}
          </p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5 shadow-panel">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Gauge size={18} aria-hidden="true" className="text-emerald-300" />
            <span>AI Engine</span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-white">Structured</p>
          <p className="mt-2 text-sm text-slate-400">Scores, quick wins, and priorities.</p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5 shadow-panel">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Sparkles size={18} aria-hidden="true" className="text-violet-300" />
            <span>Analysis Mode</span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-white">UX/UI</p>
          <p className="mt-2 text-sm text-slate-400">Senior product design critique.</p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5 shadow-panel">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Wand2 size={18} aria-hidden="true" className="text-amber-300" />
            <span>Next Upgrade</span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-white">History</p>
          <p className="mt-2 text-sm text-slate-400">Save and revisit reports.</p>
        </article>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-6 shadow-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">What Ghost Designer Checks</h3>
              <p className="mt-2 text-sm text-slate-400">
                Every analysis produces structured UX scores and action-ready suggestions.
              </p>
            </div>
            <CheckCircle2 size={26} aria-hidden="true" className="text-emerald-300" />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              'Visual hierarchy',
              'Accessibility contrast',
              'Typography quality',
              'Spacing rhythm',
              'Color system',
              'Top priority fix',
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-6 shadow-panel">
          <div className="flex items-center gap-3">
            <History size={18} aria-hidden="true" className="text-slate-300" />
            <h3 className="text-lg font-semibold text-white">Recent Analysis</h3>
          </div>

          <div className="mt-5 rounded-lg border border-dashed border-white/10 bg-slate-950/50 p-5 text-sm text-slate-400">
            No saved history yet. Phase 8 will store your latest screenshots, scores,
            quick wins, and AI design reports here.
          </div>
        </article>
      </div>
    </section>
  );
}