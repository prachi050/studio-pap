import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex h-screen bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_32rem)]">
        <Sidebar />
        <main className="h-screen min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}