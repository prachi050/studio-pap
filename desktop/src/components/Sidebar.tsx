import { Home, Lightbulb, Settings, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navigationItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Live Analysis', path: '/live-analysis', icon: Sparkles },
  { label: 'Suggestions', path: '/suggestions', icon: Lightbulb },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-slate-950/90 px-5 py-6">
      <div className="mb-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400 text-slate-950 shadow-glow">
          <Sparkles size={21} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-white">Ghost Designer</h1>
        <p className="mt-1 text-sm text-slate-400">AI Design Copilot</p>
      </div>

      <nav className="space-y-1">
        {navigationItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              [
                'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition',
                isActive
                  ? 'bg-white text-slate-950'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white',
              ].join(' ')
            }
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
