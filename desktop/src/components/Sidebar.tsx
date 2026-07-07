import {
  BarChart3,
  Bot,
  Camera,
  History,
  Home,
  Settings,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Capture', path: '/screen-capture', icon: Camera },
  { label: 'Analysis', path: '/suggestions', icon: BarChart3 },
  { label: 'History', path: '/suggestions', icon: History },
  { label: 'Assistant', path: '/live-analysis', icon: Bot },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-white/10 bg-[#050608] px-5 py-6">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00D97E]/30 bg-white/[0.04] shadow-[0_0_28px_rgba(0,217,126,0.22)]">
            <svg
              viewBox="0 0 64 64"
              className="h-8 w-8"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M18 34C10 26 16 14 27 22L37 30C45 38 54 32 51 23C48 14 35 16 29 28L25 36C19 48 6 50 10 39C13 29 27 28 36 38L46 46"
                stroke="#F1F5F9"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="32" r="4" fill="#00D97E" />
              <path
                d="M43 19L51 15L48 24"
                stroke="#00D97E"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-[0.08em] text-[#F1F5F9]">
              Studio PAP
            </h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-[#00D97E]">
              Design Intelligence
            </p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-[#00D97E]/12 text-[#F1F5F9] shadow-[0_0_24px_rgba(0,217,126,0.12)]'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-[#F1F5F9]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    aria-hidden="true"
                    className={isActive ? 'text-[#00D97E]' : 'text-slate-500'}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-[#00D97E]/20 bg-[#00D97E]/[0.08] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#00D97E]">
          Active Engine
        </p>
        <p className="mt-2 text-sm font-medium text-[#F1F5F9]">
          AI Design Review
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Structured scores, quick wins, and design intelligence.
        </p>
      </div>
    </aside>
  );
}