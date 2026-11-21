import {
  Bot,
  Brush,
  Check,
  Info,
  LogOut,
  Mic,
  Play,
  ScanSearch,
  Sparkles,
  Trash2,
  User,
  Volume2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { clearAnalysisHistory } from "../services/analysisHistory";
import { getCurrentUser, logout } from "../services/auth";
import {
  generateVoiceSpeech,
  type StudioVoice,
} from "../services/voiceSpeech";
import {
  getVoiceSettings,
  updateVoiceSettings,
  type VoiceExperience,
  type VoiceSettings,
} from "../services/voiceSettings";

type ThemeId = "studio-green" | "monochrome" | "amber" | "stone";

type ThemeOption = {
  id: ThemeId;
  name: string;
  description: string;
  colors: string[];
};

type VoiceOption = {
  id: StudioVoice;
  name: string;
  description: string;
};

type ExperienceOption = {
  id: VoiceExperience;
  name: string;
  description: string;
  recommended?: boolean;
};

const THEME_STORAGE_KEY = "studio-pap-theme";
const THEME_CHANGE_EVENT = "studio-pap-theme-change";
const ASSISTANT_CHATS_KEY = "studio-pap-assistant-chats";

const themes: ThemeOption[] = [
  {
    id: "studio-green",
    name: "Studio Green",
    description: "The original Studio PAP appearance.",
    colors: ["#050608", "#00D97E", "#F1F5F9"],
  },
  {
    id: "monochrome",
    name: "Monochrome",
    description: "A minimal black-and-white workspace.",
    colors: ["#050505", "#FFFFFF", "#A1A1AA"],
  },
  {
    id: "amber",
    name: "Amber",
    description: "A warm orange-and-black workspace.",
    colors: ["#080604", "#F59E0B", "#FFF7ED"],
  },
  {
    id: "stone",
    name: "Stone",
    description: "A soft grey-and-white workspace.",
    colors: ["#F5F5F2", "#FFFFFF", "#292524"],
  },
];

const voiceOptions: VoiceOption[] = [
  {
    id: "aria",
    name: "Aria",
    description: "Warm, natural, and confident.",
  },
  {
    id: "luna",
    name: "Iris",
    description: "Soft, calm, and supportive.",
  },
  {
    id: "ethan",
    name: "Ethan",
    description: "Clear, precise, and professional.",
  },
];

const experienceOptions: ExperienceOption[] = [
  {
    id: "voice-only",
    name: "Voice Only",
    description:
      "Play the response aloud and keep the full transcript collapsed until requested.",
    recommended: true,
  },
  {
    id: "voice-transcript",
    name: "Voice + Transcript",
    description:
      "Play the response aloud while also displaying the complete written transcript.",
  },
  {
    id: "transcript-only",
    name: "Transcript Only",
    description:
      "Show the written response without automatically playing assistant audio.",
  },
];

function getSavedTheme(): ThemeId {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;

  return themes.some((theme) => theme.id === saved)
    ? (saved as ThemeId)
    : "studio-green";
}

function getVoiceName(voice: StudioVoice): string {
  return voiceOptions.find((option) => option.id === voice)?.name ?? "Aria";
}

function getExperienceName(experience: VoiceExperience): string {
  return (
    experienceOptions.find((option) => option.id === experience)?.name ??
    "Voice Only"
  );
}

function getVoicePreviewText(voice: StudioVoice): string {
  switch (voice) {
    case "luna":
      return "Hello, I'm Iris. Let's create something thoughtful together.";
    case "ethan":
      return "Hello, I'm Ethan. Let's review your design with clarity and precision.";
    case "aria":
    default:
      return "Hello, I'm Aria, your AI design assistant. I'm ready whenever you are.";
  }
}

export function SettingsPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(getSavedTheme);
  const [voiceSettings, setVoiceSettings] =
    useState<VoiceSettings>(getVoiceSettings);
  const [notice, setNotice] = useState("");
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const noticeTimerRef = useRef<number | null>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);
  const testAudioUrlRef = useRef<string | null>(null);

  const voiceName = useMemo(
    () => getVoiceName(voiceSettings.voice as StudioVoice),
    [voiceSettings.voice],
  );

  const experienceName = useMemo(
    () => getExperienceName(voiceSettings.experience),
    [voiceSettings.experience],
  );

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
      }

      if (testAudioRef.current) {
        testAudioRef.current.pause();
      }

      if (testAudioUrlRef.current) {
        URL.revokeObjectURL(testAudioUrlRef.current);
      }
    };
  }, []);

  function showNotice(message: string) {
    setNotice(message);

    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }

    noticeTimerRef.current = window.setTimeout(() => {
      setNotice("");
      noticeTimerRef.current = null;
    }, 2500);
  }

  function stopVoicePreview() {
    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current.currentTime = 0;
      testAudioRef.current = null;
    }

    if (testAudioUrlRef.current) {
      URL.revokeObjectURL(testAudioUrlRef.current);
      testAudioUrlRef.current = null;
    }

    setIsTestingVoice(false);
  }

  function handleThemeChange(themeId: ThemeId) {
    setSelectedTheme(themeId);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));

    const themeName =
      themes.find((theme) => theme.id === themeId)?.name ?? "Theme";

    showNotice(`${themeName} selected.`);
  }

  function handleVoiceSettingsChange(updates: Partial<VoiceSettings>) {
    const nextSettings = updateVoiceSettings(updates);
    setVoiceSettings(nextSettings);
    showNotice("Voice preferences updated.");
  }

  async function handleTestVoice() {
    if (isTestingVoice) {
      stopVoicePreview();
      return;
    }

    try {
      setIsTestingVoice(true);

      if (testAudioRef.current || testAudioUrlRef.current) {
        stopVoicePreview();
        setIsTestingVoice(true);
      }

      const selectedVoice = voiceSettings.voice as StudioVoice;

      const speechBlob = await generateVoiceSpeech({
        text: getVoicePreviewText(selectedVoice),
        voice: selectedVoice,
        speed: voiceSettings.speed,
      });

      const audioUrl = URL.createObjectURL(speechBlob);
      const audio = new Audio(audioUrl);

      testAudioUrlRef.current = audioUrl;
      testAudioRef.current = audio;

      audio.playbackRate = 1;

      audio.onended = () => {
        stopVoicePreview();
      };

      audio.onerror = () => {
        stopVoicePreview();
        showNotice("The voice preview could not be played.");
      };

      await audio.play();
    } catch (error) {
      console.error("Voice preview failed:", error);
      stopVoicePreview();
      showNotice("The voice preview could not be generated.");
    }
  }

  function handleClearChats() {
    localStorage.removeItem(ASSISTANT_CHATS_KEY);
    showNotice("Assistant chats cleared.");
  }

  function handleClearAnalysis() {
    clearAnalysisHistory();
    showNotice("Analysis history cleared.");
  }

  function handleClearAll() {
    localStorage.removeItem(ASSISTANT_CHATS_KEY);
    clearAnalysisHistory();
    setShowClearAllConfirm(false);
    showNotice("All chats and analyses were cleared.");
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 text-[var(--text-primary)] md:px-10 md:py-12">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--accent-primary)]">
          Studio PAP
        </p>

        <h1 className="mt-4 text-4xl font-semibold text-[var(--text-primary)]">
          Preferences
        </h1>

        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
          Customize your account, workspace appearance, AI tools, voice
          experience, and locally saved Studio PAP data.
        </p>
      </header>

      {notice ? (
        <div
          role="status"
          className="mt-6 flex items-center gap-3 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-text)]"
        >
          <Check size={17} />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className="mt-10 space-y-8">
        <PreferenceSection>
          <SectionHeading
            icon={<User size={22} />}
            title="Account"
            description="Your local Studio PAP account."
          />

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field
              id="account-name"
              label="Name"
              value={currentUser?.name ?? "Prachi Ashwin Patel"}
            />

            <Field
              id="account-email"
              label="Email"
              value={currentUser?.email ?? "you@example.com"}
            />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm font-medium text-red-500 transition hover:bg-red-400/20"
          >
            <LogOut size={18} />
            Logout
          </button>
        </PreferenceSection>

        <PreferenceSection>
          <SectionHeading
            icon={<Brush size={22} />}
            title="Appearance"
            description="Choose a curated Studio PAP theme."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {themes.map((theme) => {
              const selected = selectedTheme === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeChange(theme.id)}
                  className={
                    selected
                      ? "relative rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5 text-left shadow-[0_0_28px_var(--theme-glow)] transition"
                      : "relative rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-5 text-left transition hover:border-[var(--accent-border)] hover:bg-[var(--background-soft)]"
                  }
                >
                  {selected ? (
                    <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[var(--button-text)]">
                      <Check size={16} />
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    {theme.colors.map((color, index) => (
                      <span
                        key={`${theme.id}-${index}`}
                        className="h-7 w-7 rounded-full border border-[var(--border-primary)]"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <p className="mt-5 font-semibold text-[var(--text-primary)]">
                    {theme.name}
                  </p>

                  <p className="mt-2 pr-8 text-sm leading-6 text-[var(--text-secondary)]">
                    {theme.description}
                  </p>
                </button>
              );
            })}
          </div>

          <p className="mt-5 text-xs leading-5 text-[var(--text-muted)]">
            Your selected appearance is saved locally and applied automatically
            when Studio PAP opens.
          </p>
        </PreferenceSection>

        <PreferenceSection>
          <SectionHeading
            icon={<Sparkles size={22} />}
            title="AI Configuration"
            description="Models currently powering Studio PAP."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ModelCard
              icon={<Bot size={20} />}
              label="Assistant"
              model="GPT-4.1 mini"
              description="Design questions, follow-ups, and contextual guidance."
            />

            <ModelCard
              icon={<ScanSearch size={20} />}
              label="Vision"
              model="GPT-4.1"
              description="Screenshot and uploaded-image analysis."
            />

            <ModelCard
              icon={<Mic size={20} />}
              label="Voice"
              model="GPT-4o Mini Transcribe"
              description="Microphone recording and speech transcription."
            />
          </div>
        </PreferenceSection>

        <PreferenceSection>
          <SectionHeading
            icon={<Volume2 size={22} />}
            title="Voice Assistant"
            description="Personalize how Studio PAP speaks and displays responses."
          />

          <div className="mt-7 space-y-8">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                Default Voice
              </h3>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Choose the personality used for spoken assistant responses.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {voiceOptions.map((voice) => {
                  const selected = voiceSettings.voice === voice.id;

                  return (
                    <button
                      key={voice.id}
                      type="button"
                      onClick={() =>
                        handleVoiceSettingsChange({ voice: voice.id })
                      }
                      className={
                        selected
                          ? "relative rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5 text-left shadow-[0_0_24px_var(--theme-glow)] transition"
                          : "relative rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-5 text-left transition hover:border-[var(--accent-border)] hover:bg-[var(--background-soft)]"
                      }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                          <Volume2 size={19} />
                        </div>

                        <SelectionDot selected={selected} />
                      </div>

                      <p className="mt-4 font-semibold text-[var(--text-primary)]">
                        {voice.name}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {voice.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                Voice Experience
              </h3>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Control whether responses are spoken, displayed, or both.
              </p>

              <div className="mt-4 space-y-3">
                {experienceOptions.map((option) => {
                  const selected =
                    voiceSettings.experience === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        handleVoiceSettingsChange({
                          experience: option.id,
                        })
                      }
                      className={
                        selected
                          ? "flex w-full items-start gap-4 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5 text-left transition"
                          : "flex w-full items-start gap-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-5 text-left transition hover:border-[var(--accent-border)] hover:bg-[var(--background-soft)]"
                      }
                    >
                      <div className="pt-0.5">
                        <SelectionDot selected={selected} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-[var(--text-primary)]">
                            {option.name}
                          </p>

                          {option.recommended ? (
                            <span className="rounded-full border border-[var(--accent-border)] bg-[var(--background-card)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-text)]">
                              Recommended
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                Response Options
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ToggleCard
                  title="Auto Speak Responses"
                  description="Automatically play the selected voice when a new assistant reply is ready."
                  checked={voiceSettings.autoSpeak}
                  onChange={(checked) =>
                    handleVoiceSettingsChange({ autoSpeak: checked })
                  }
                />

                <ToggleCard
                  title="Collapse Transcript by Default"
                  description="Keep the full written response hidden until you choose to expand it."
                  checked={voiceSettings.collapseTranscript}
                  onChange={(checked) =>
                    handleVoiceSettingsChange({
                      collapseTranscript: checked,
                    })
                  }
                />
              </div>
            </div>

            <Divider />

            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    Voice Speed
                  </h3>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Adjust how quickly the selected assistant speaks.
                  </p>
                </div>

                <span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--accent-text)]">
                  {voiceSettings.speed.toFixed(2)}×
                </span>
              </div>

              <div className="mt-5">
                <input
                  aria-label="Voice speed"
                  type="range"
                  min={0.75}
                  max={1.25}
                  step={0.05}
                  value={voiceSettings.speed}
                  onChange={(event) =>
                    handleVoiceSettingsChange({
                      speed: Number(event.target.value),
                    })
                  }
                  className="w-full accent-[var(--accent-primary)]"
                />

                <div className="mt-2 flex justify-between text-xs text-[var(--text-muted)]">
                  <span>0.75× Slow</span>
                  <span>1.00× Natural</span>
                  <span>1.25× Fast</span>
                </div>
              </div>
            </div>

            <Divider />

            <div className="flex flex-col gap-5 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent-text)]">
                  Current Voice Setup
                </p>

                <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
                  {voiceName} · {experienceName}
                </p>

                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Auto speak is{" "}
                  {voiceSettings.autoSpeak ? "enabled" : "disabled"}. Transcript
                  collapsing is{" "}
                  {voiceSettings.collapseTranscript ? "enabled" : "disabled"}.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestVoice}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-[var(--button-text)] transition hover:opacity-90"
              >
                {isTestingVoice ? (
                  <>
                    <span className="h-4 w-4 animate-pulse rounded-full bg-current" />
                    Stop Preview
                  </>
                ) : (
                  <>
                    <Play size={17} />
                    Test {voiceName}
                  </>
                )}
              </button>
            </div>
          </div>
        </PreferenceSection>

        <PreferenceSection>
          <SectionHeading
            icon={<Trash2 size={22} />}
            title="Data Management"
            description="Manage locally saved Studio PAP data."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <DataAction
              title="Clear Assistant Chats"
              description="Delete all saved conversations and attached chat images."
              buttonLabel="Clear Chats"
              onClick={handleClearChats}
            />

            <DataAction
              title="Clear Analysis History"
              description="Delete saved screenshots, scores, and reports."
              buttonLabel="Clear Analyses"
              onClick={handleClearAnalysis}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-5">
            <p className="font-medium text-red-500">Clear all saved data</p>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              This removes Assistant chats and analysis history. Your account,
              theme, and voice preferences remain.
            </p>

            {!showClearAllConfirm ? (
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(true)}
                className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-400/20"
              >
                Clear Everything
              </button>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
                >
                  Yes, Clear Everything
                </button>

                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(false)}
                  className="rounded-xl border border-[var(--border-primary)] bg-[var(--background-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--background-soft)]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </PreferenceSection>

        <PreferenceSection>
          <SectionHeading
            icon={<Info size={22} />}
            title="About"
            description="Application information."
          />

          <div className="mt-6 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--accent-border)] bg-[var(--background-card)] text-[var(--accent-primary)]">
                <Sparkles size={22} />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                  Studio PAP
                </h3>

                <p className="mt-1 text-sm text-[var(--accent-text)]">
                  AI Design Intelligence
                </p>

                <div className="mt-5 space-y-2 text-sm text-[var(--text-secondary)]">
                  <p>Version 2.0.0</p>
                  <p>Built by Prachi Ashwin Patel</p>
                  <p>Electron · React · TypeScript · FastAPI</p>
                </div>
              </div>
            </div>
          </div>
        </PreferenceSection>
      </div>
    </section>
  );
}

function PreferenceSection({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--background-soft)] p-6 md:p-7">
      {children}
    </section>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[var(--accent-primary)]">{icon}</div>

      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          {title}
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm text-[var(--text-secondary)]"
      >
        {label}
      </label>

      <input
        id={id}
        value={value}
        readOnly
        className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--background-card)] px-4 py-3 text-[var(--text-primary)] outline-none"
      />
    </div>
  );
}

function Divider() {
  return <div className="border-t border-[var(--border-primary)]" />;
}

function SelectionDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={
        selected
          ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--accent-primary)] bg-[var(--accent-primary)]"
          : "h-5 w-5 shrink-0 rounded-full border border-[var(--border-primary)] bg-[var(--background-card)]"
      }
    >
      {selected ? (
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--button-text)]" />
      ) : null}
    </span>
  );
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={
        checked
          ? "flex items-start justify-between gap-5 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5 text-left transition"
          : "flex items-start justify-between gap-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-5 text-left transition hover:border-[var(--accent-border)] hover:bg-[var(--background-soft)]"
      }
    >
      <div>
        <p className="font-medium text-[var(--text-primary)]">{title}</p>

        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>

      <span
        className={
          checked
            ? "relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-[var(--accent-primary)] transition"
            : "relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-[var(--border-primary)] transition"
        }
      >
        <span
          className={
            checked
              ? "absolute left-6 top-1 h-4 w-4 rounded-full bg-[var(--button-text)] transition"
              : "absolute left-1 top-1 h-4 w-4 rounded-full bg-[var(--text-muted)] transition"
          }
        />
      </span>
    </button>
  );
}

function ModelCard({
  icon,
  label,
  model,
  description,
}: {
  icon: ReactNode;
  label: string;
  model: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
        {icon}
      </div>

      <p className="mt-4 text-sm text-[var(--text-muted)]">{label}</p>

      <p className="mt-1 font-semibold text-[var(--text-primary)]">{model}</p>

      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
    </article>
  );
}

function DataAction({
  title,
  description,
  buttonLabel,
  onClick,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-5">
      <p className="font-medium text-[var(--text-primary)]">{title}</p>

      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 rounded-xl border border-[var(--border-primary)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-500"
      >
        {buttonLabel}
      </button>
    </article>
  );
}