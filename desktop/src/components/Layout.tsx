import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar";

const THEME_STORAGE_KEY = "studio-pap-theme";
const THEME_CHANGE_EVENT = "studio-pap-theme-change";

function applySavedTheme() {
  const savedTheme =
    localStorage.getItem(THEME_STORAGE_KEY) ?? "studio-green";

  document.documentElement.setAttribute(
    "data-theme",
    savedTheme,
  );
}

export function Layout() {
  useEffect(() => {
    applySavedTheme();

    const handleThemeChange = () => {
      applySavedTheme();
    };

    window.addEventListener(
      THEME_CHANGE_EVENT,
      handleThemeChange,
    );

    return () => {
      window.removeEventListener(
        THEME_CHANGE_EVENT,
        handleThemeChange,
      );
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--background-primary)] text-[var(--text-primary)]">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}