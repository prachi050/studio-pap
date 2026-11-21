import {
  Activity,
  ArrowRight,
  Camera,
  History,
  ImagePlus,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { useBackendStatus } from "../hooks/useBackendStatus";
import { getAnalysisHistory } from "../services/analysisHistory";
import { getAssistantChats } from "../services/assistantHistory";
import { getCurrentUser } from "../services/auth";

function getStatusLabel(status: string): string {
  if (status === "connected") return "Connected";
  if (status === "offline") return "Offline";
  if (status === "checking") return "Checking...";
  return "Not Checked";
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

export function HomePage() {
  const {
    status,
    lastCheckedAt,
    checkBackend,
  } = useBackendStatus();

  const currentUser = getCurrentUser();
  const analysisHistory = getAnalysisHistory();
  const assistantChats = getAssistantChats();

  const recentAnalyses = analysisHistory.slice(0, 3);
  const recentChats = assistantChats.slice(0, 3);

  const firstName =
  currentUser?.name
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(
      /^./,
      (char) => char.toUpperCase()
    ) || "Designer";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-10 py-12">
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-8 shadow-[0_0_55px_var(--theme-glow)]">
        <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[var(--theme-glow)] blur-[100px]" />

        <div className="relative">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-[var(--accent-primary)]">
            Workspace
          </p>

          <h1 className="mt-5 text-5xl font-semibold leading-tight text-[var(--text-primary)]">
            {getGreeting()}, {firstName}.
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            Thoughtful design begins with thoughtful decisions.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/screen-capture"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 text-sm font-semibold text-[var(--button-text)] shadow-[0_0_30px_var(--theme-glow)] transition hover:bg-[var(--accent-hover)]"
            >
              <Camera size={17} />
              Capture Screen
            </Link>

            <Link
              to="/live-analysis"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--background-soft)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)]"
            >
              <MessageSquare
                size={17}
                className="text-[var(--accent-primary)]"
              />

              Open Assistant
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceCard
          to="/screen-capture"
          icon={<Camera size={22} />}
          title="Capture Screen"
          description="Capture anything visible on your desktop and analyze it."
        />

        <WorkspaceCard
          to="/live-analysis"
          icon={<ImagePlus size={22} />}
          title="Upload Design"
          description="Upload one image directly inside the Assistant."
        />

        <WorkspaceCard
          to="/live-analysis"
          icon={<MessageSquare size={22} />}
          title="AI Assistant"
          description="Ask follow-up questions and get specialist feedback."
        />

        <WorkspaceCard
          to="/suggestions"
          icon={<History size={22} />}
          title="Analysis History"
          description="Review your latest scores, reports, and recommendations."
        />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <article className="theme-card rounded-2xl border p-5">
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <Activity
              size={18}
              className="text-[var(--accent-primary)]"
            />
            Backend
          </div>

          <p className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">
            {getStatusLabel(status)}
          </p>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {lastCheckedAt
              ? `Last checked ${lastCheckedAt.toLocaleTimeString()}`
              : "Ready to check Studio PAP backend."}
          </p>

          <button
            type="button"
            onClick={checkBackend}
            disabled={status === "checking"}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-primary)] transition hover:text-[var(--accent-text)] disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={
                status === "checking"
                  ? "animate-spin"
                  : ""
              }
            />

            Check connection
          </button>
        </article>

        <article className="theme-card rounded-2xl border p-5">
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <Sparkles
              size={18}
              className="text-[var(--accent-primary)]"
            />
            Analyses
          </div>

          <p className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">
            {analysisHistory.length}
          </p>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Saved design reviews on this device.
          </p>
        </article>

        <article className="theme-card rounded-2xl border p-5">
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <MessageSquare
              size={18}
              className="text-[var(--accent-primary)]"
            />
            Assistant Chats
          </div>

          <p className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">
            {assistantChats.length}
          </p>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Saved conversations and uploaded design reviews.
          </p>
        </article>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="theme-card rounded-2xl border p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Recent Analyses
              </h2>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Your latest design intelligence reports.
              </p>
            </div>

            <Link
              to="/suggestions"
              className="inline-flex items-center gap-1 text-sm text-[var(--accent-primary)] transition hover:text-[var(--accent-text)]"
            >
              View history
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {recentAnalyses.length > 0 ? (
              recentAnalyses.map((analysis) => (
                <Link
                  key={analysis.id}
                  to="/suggestions"
                  className="flex items-center gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--background-secondary)] p-3 transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)]"
                >
                  <img
                    src={analysis.screenshot_data_url}
                    alt={analysis.screen_type}
                    className="h-14 w-20 rounded-lg object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {analysis.screen_type}
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {formatDate(
                        analysis.captured_at,
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent-text)]">
                    {analysis.design_score}
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState text="Your recent analysis reports will appear here." />
            )}
          </div>
        </article>

        <article className="theme-card rounded-2xl border p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Recent Chats
              </h2>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Continue your latest Studio PAP conversations.
              </p>
            </div>

            <Link
              to="/live-analysis"
              className="inline-flex items-center gap-1 text-sm text-[var(--accent-primary)] transition hover:text-[var(--accent-text)]"
            >
              Open Assistant
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {recentChats.length > 0 ? (
              recentChats.map((chat) => (
                <Link
                  key={chat.id}
                  to="/live-analysis"
                  className="flex items-center gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--background-secondary)] p-4 transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                    <MessageSquare size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {chat.title}
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {formatDate(chat.updatedAt)}
                    </p>
                  </div>

                  <ArrowRight
                    size={16}
                    className="text-[var(--text-muted)]"
                  />
                </Link>
              ))
            ) : (
              <EmptyState text="Your saved Assistant chats will appear here." />
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

function WorkspaceCard({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)] transition group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--button-text)]">
        {icon}
      </div>

      <h2 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>

      <div className="mt-5 flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)]">
        Open

        <ArrowRight
          size={15}
          className="transition group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-primary)] bg-[var(--background-secondary)] p-6 text-center text-sm text-[var(--text-muted)]">
      {text}
    </div>
  );
}