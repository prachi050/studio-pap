import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { FloatingAssistant } from "./components/FloatingAssistant";
import { Layout } from "./components/Layout";
import { isLoggedIn } from "./services/auth";

import { HomePage } from "./pages/HomePage";
import { LiveAnalysisPage } from "./pages/LiveAnalysisPage";
import { LoginPage } from "./pages/LoginPage";
import { ScreenCapturePage } from "./pages/ScreenCapturePage";
import { SettingsPage } from "./pages/SettingsPage";
import { SuggestionsPage } from "./pages/SuggestionsPage";

function ProtectedRoutes() {
  if (!isLoggedIn()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}

function LoginRoute() {
  if (isLoggedIn()) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <LoginPage />;
}

function MainApplication() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginRoute />}
      />

      <Route element={<ProtectedRoutes />}>
        <Route element={<Layout />}>
          <Route
            index
            element={<HomePage />}
          />

          <Route
            path="live-analysis"
            element={<LiveAnalysisPage />}
          />

          <Route
            path="screen-capture"
            element={<ScreenCapturePage />}
          />

          <Route
            path="suggestions"
            element={<SuggestionsPage />}
          />

          <Route
            path="settings"
            element={<SettingsPage />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to={isLoggedIn() ? "/" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}

export function App() {
  const searchParams = new URLSearchParams(
    window.location.search,
  );

  const isFloatingWindow =
    searchParams.get("window") === "floating";

  if (isFloatingWindow) {
    return <FloatingAssistant />;
  }

  return <MainApplication />;
}