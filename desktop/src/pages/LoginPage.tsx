import {
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  createAccount,
  getStoredAccount,
  login,
} from "../services/auth";
import { StudioPapLogo } from "../components/StudioPapLogo";
type AuthMode = "login" | "create";

export function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>(
    getStoredAccount() ? "login" : "create",
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        createAccount(name, email, password);
      } else {
        login(email, password);
      }

      navigate("/", {
        replace: true,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setError("");
    setPassword("");

    setMode((currentMode) =>
      currentMode === "login"
        ? "create"
        : "login",
    );
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background-primary)] px-6 py-10 text-[var(--text-primary)]">
      <div className="absolute left-1/2 top-[-260px] h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[var(--theme-glow)] blur-[150px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[var(--border-primary)] bg-[var(--background-secondary)] shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden border-r border-[var(--border-primary)] bg-[var(--accent-soft)] p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-2 text-sm text-[var(--accent-text)]">
              <Sparkles size={16} />
              AI Design Intelligence
            </div>

            <h1 className="mt-8 text-5xl font-semibold leading-tight text-[var(--text-primary)]">
              Design clarity,
              <br />
              powered by AI.
            </h1>

            <p className="mt-6 max-w-md leading-7 text-[var(--text-secondary)]">
              Analyze interfaces, jewelry, interiors,
              architecture, branding, presentations, and
              more from one focused creative workspace.
            </p>
          </div>

          <div className="text-sm text-[var(--text-muted)]">
            Studio PAP · Version 1
          </div>
        </section>

        <section className="bg-[var(--background-secondary)] p-8 sm:p-12">
          <div className="mx-auto max-w-md">
            <StudioPapLogo
  size={54}
  showName={false}
/>

            <p className="mt-8 text-sm font-medium uppercase tracking-[0.24em] text-[var(--accent-primary)]">
              Studio PAP
            </p>

            <h2 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">
              {mode === "create"
                ? "Create your account"
                : "Welcome back"}
            </h2>

            <p className="mt-3 text-[var(--text-secondary)]">
              {mode === "create"
                ? "Set up your local Studio PAP workspace."
                : "Log in to continue to your workspace."}
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              {mode === "create" ? (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm text-[var(--text-secondary)]"
                  >
                    Name
                  </label>

                  <input
                    id="name"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Prachi Ashwin Patel"
                    autoComplete="name"
                    className="h-13 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--background-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-border)]"
                  />
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm text-[var(--text-secondary)]"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-13 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--background-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-border)]"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm text-[var(--text-secondary)]"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Minimum 6 characters"
                    autoComplete={
                      mode === "create"
                        ? "new-password"
                        : "current-password"
                    }
                    className="h-13 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--background-card)] px-4 py-3 pr-12 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-border)]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--background-soft)] hover:text-[var(--text-primary)]"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-500">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-3 font-semibold text-[var(--button-text)] shadow-[0_0_24px_var(--theme-glow)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mode === "create"
                  ? "Create Account"
                  : "Continue"}

                <ArrowRight size={18} />
              </button>
            </form>

            <button
              type="button"
              onClick={switchMode}
              className="mt-6 w-full text-center text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              {mode === "create"
                ? "Already have an account? Log in"
                : "Need an account? Create one"}
            </button>

            <p className="mt-8 text-center text-xs leading-5 text-[var(--text-muted)]">
              Version 1 stores this account locally on
              this device. Cloud login and synchronization
              can be added later.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}