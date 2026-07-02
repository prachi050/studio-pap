import { Activity, RefreshCw } from 'lucide-react';

import { useBackendStatus } from '../hooks/useBackendStatus';

function getStatusLabel(status: string): string {
  if (status === 'connected') {
    return '🟢 Backend Connected';
  }

  if (status === 'offline') {
    return '🔴 Backend Offline';
  }

  if (status === 'checking') {
    return 'Checking Backend...';
  }

  return 'Not Checked';
}

export function HomePage() {
  const { status, lastCheckedAt, checkBackend } = useBackendStatus();

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-10 py-12">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Desktop AI Workspace
        </p>
        <h2 className="mt-5 text-6xl font-semibold text-white">Ghost Designer</h2>
        <p className="mt-4 text-xl text-slate-300">AI Design Copilot</p>
      </div>

      <div className="mt-12 grid max-w-3xl gap-5 md:grid-cols-[1fr_auto]">
        <article className="rounded-lg border border-white/10 bg-white/[0.06] p-6 shadow-panel backdrop-blur">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                <Activity size={18} aria-hidden="true" />
                <span>Backend Status</span>
              </div>
              <p className="mt-5 text-2xl font-semibold text-white">{getStatusLabel(status)}</p>
              <p className="mt-3 text-sm text-slate-400">
                {lastCheckedAt
                  ? `Last checked ${lastCheckedAt.toLocaleTimeString()}`
                  : 'Ready to check the local FastAPI service.'}
              </p>
            </div>
          </div>
        </article>

        <button
          type="button"
          onClick={checkBackend}
          disabled={status === 'checking'}
          className="inline-flex h-14 items-center justify-center gap-2 self-end rounded-lg bg-cyan-300 px-5 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCw
            size={17}
            aria-hidden="true"
            className={status === 'checking' ? 'animate-spin' : ''}
          />
          Check Backend
        </button>
      </div>
    </section>
  );
}
