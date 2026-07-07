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
      <div className="rounded-2xl border border-[#00D97E]/20 bg-[#00D97E]/[0.08] p-8 shadow-[0_0_40px_rgba(0,217,126,0.12)]">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#00D97E]">
              Design Intelligence
            </p>

            <h2 className="mt-5 text-5xl font-semibold text-[#F1F5F9]">
              Studio PAP
            </h2>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Capture any screen, analyze it with AI vision, and get structured
              design scores, quick wins, and senior-level UX feedback.
            </p>

            <div className="mt-7 flex gap-3">
              <Link
                to="/screen-capture"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#00D97E] px-5 text-sm font-semibold text-[#050608] shadow-[0_0_30px_rgba(0,217,126,0.25)] transition hover:bg-[#16F28B]"
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

          <div className="min-w-[190px] rounded-2xl border border-white/10 bg-[#050608]/70 p-6 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Latest Score
            </p>
            <p className="mt-4 text-6xl font-semibold text-[#F1F5F9]">—</p>
            <p className="mt-3 text-sm text-slate-400">
              Analyze a screen to generate your first score.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5 shadow-panel">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Activity size={18} aria-hidden="true" className="text-[#00D97E]" />
            <span>Backend</span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-[#F1F5F9]">
            {getStatusLabel(status)}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {lastCheckedAt
              ? `Last checked ${lastCheckedAt.toLocaleTimeString()}`
              : 'Ready to check FastAPI.'}
          </p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5 shadow-panel">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Gauge size={18} aria-hidden="true" className="text-[#00D97E]" />
            <span>AI Engine</span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-[#F1F5F9]">
            Structured
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Scores, quick wins, and priorities.
          </p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5 shadow-panel">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Sparkles size={18} aria-hidden="true" className="text-[#00D97E]" />
            <span>Analysis Mode</span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-[#F1F5F9]">UX/UI</p>
          <p className="mt-2 text-sm text-slate-400">
            Senior product design critique.
          </p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-5 shadow-panel">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Wand2 size={18} aria-hidden="true" className="text-[#00D97E]" />
            <span>Next Upgrade</span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-[#F1F5F9]">Assistant</p>
          <p className="mt-2 text-sm text-slate-400">
            Voice and chat design support.
          </p>
        </article>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-6 shadow-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#F1F5F9]">
                What Studio PAP Checks
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Every analysis produces structured UX scores and action-ready
                suggestions.
              </p>
            </div>
            <CheckCircle2 size={26} aria-hidden="true" className="text-[#00D97E]" />
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
                className="rounded-lg border border-white/10 bg-[#050608]/60 px-4 py-3 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.06] p-6 shadow-panel">
          <div className="flex items-center gap-3">
            <History size={18} aria-hidden="true" className="text-[#00D97E]" />
            <h3 className="text-lg font-semibold text-[#F1F5F9]">
              Recent Analysis
            </h3>
          </div>

          <div className="mt-5 rounded-lg border border-dashed border-white/10 bg-[#050608]/60 p-5 text-sm text-slate-400">
            Your latest screenshots, scores, quick wins, and AI design reports
            will appear here.
          </div>
        </article>
      </div>
    </section>
  );
}