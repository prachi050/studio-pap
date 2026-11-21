import {
  Home,
  LogOut,
  Settings,
} from "lucide-react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  getCurrentUser,
  logout,
} from "../services/auth";
import { StudioPapLogo } from "./StudioPapLogo";

export function Sidebar() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <aside className="theme-sidebar flex min-h-screen w-72 shrink-0 flex-col border-r px-5 py-6">
      <div className="mb-10">
        <StudioPapLogo
          size={54}
          showName
        />
      </div>

      <nav className="space-y-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            [
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
              isActive
                ? "border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--text-primary)] shadow-[0_0_24px_var(--theme-glow)]"
                : "border border-transparent text-[var(--text-secondary)] hover:bg-[var(--background-soft)] hover:text-[var(--text-primary)]",
            ].join(" ")
          }
        >
          {({ isActive }) => (
            <>
              <Home
                size={18}
                className={
                  isActive
                    ? "text-[var(--accent-primary)]"
                    : "text-[var(--text-muted)]"
                }
              />

              <span>Home</span>
            </>
          )}
        </NavLink>
      </nav>

      <div className="mt-auto">
        <div className="theme-card rounded-2xl border p-4">
          <p className="font-medium text-[var(--text-primary)]">
            {user?.name ?? "Prachi Ashwin Patel"}
          </p>

          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
            {user?.email ?? "you@example.com"}
          </p>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              [
                "mt-5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition",
                isActive
                  ? "bg-[var(--accent-soft)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--background-soft)] hover:text-[var(--text-primary)]",
              ].join(" ")
            }
          >
            <Settings
              size={18}
              className="text-[var(--accent-primary)]"
            />

            <span>Settings</span>
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={18} />

            <span>Logout</span>
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-primary)]">
            Active Engine
          </p>

          <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
            GPT-4.1 + GPT-4.1 mini
          </p>

          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            AI Design Intelligence
          </p>
        </div>
      </div>
    </aside>
  );
}