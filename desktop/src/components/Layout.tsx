import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="h-screen overflow-hidden bg-[#050608] text-[#F1F5F9]">
      <div className="flex h-screen bg-[radial-gradient(circle_at_top_right,rgba(0,217,126,0.12),transparent_34rem)]">
        <Sidebar />
        <main className="h-screen min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}