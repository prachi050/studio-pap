import type { StudioVoice } from "./voiceSpeech";

export type VoiceExperience =
  | "voice-only"
  | "voice-transcript"
  | "transcript-only";

export interface VoiceSettings {
  voice: StudioVoice;
  experience: VoiceExperience;
  autoSpeak: boolean;
  collapseTranscript: boolean;
  speed: number;
}

const VOICE_SETTINGS_KEY =
  "studio-pap-voice-settings";

const VOICE_SETTINGS_CHANGE_EVENT =
  "studio-pap-voice-settings-change";

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voice: "aria",
  experience: "voice-only",
  autoSpeak: true,
  collapseTranscript: true,
  speed: 1,
};

function isStudioVoice(
  value: unknown,
): value is StudioVoice {
  return (
    value === "aria" ||
    value === "luna" ||
    value === "ethan"
  );
}

function isVoiceExperience(
  value: unknown,
): value is VoiceExperience {
  return (
    value === "voice-only" ||
    value === "voice-transcript" ||
    value === "transcript-only"
  );
}

function normalizeSpeed(value: unknown): number {
  if (
    typeof value !== "number" ||
    Number.isNaN(value)
  ) {
    return DEFAULT_VOICE_SETTINGS.speed;
  }

  return Math.min(1.25, Math.max(0.75, value));
}

export function getVoiceSettings(): VoiceSettings {
  try {
    const storedValue = localStorage.getItem(
      VOICE_SETTINGS_KEY,
    );

    if (!storedValue) {
      return DEFAULT_VOICE_SETTINGS;
    }

    const parsed = JSON.parse(
      storedValue,
    ) as Partial<VoiceSettings>;

    return {
      voice: isStudioVoice(parsed.voice)
        ? parsed.voice
        : DEFAULT_VOICE_SETTINGS.voice,

      experience: isVoiceExperience(
        parsed.experience,
      )
        ? parsed.experience
        : DEFAULT_VOICE_SETTINGS.experience,

      autoSpeak:
        typeof parsed.autoSpeak === "boolean"
          ? parsed.autoSpeak
          : DEFAULT_VOICE_SETTINGS.autoSpeak,

      collapseTranscript:
        typeof parsed.collapseTranscript ===
        "boolean"
          ? parsed.collapseTranscript
          : DEFAULT_VOICE_SETTINGS.collapseTranscript,

      speed: normalizeSpeed(parsed.speed),
    };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

export function saveVoiceSettings(
  settings: VoiceSettings,
): VoiceSettings {
  const normalizedSettings: VoiceSettings = {
    voice: isStudioVoice(settings.voice)
      ? settings.voice
      : DEFAULT_VOICE_SETTINGS.voice,

    experience: isVoiceExperience(
      settings.experience,
    )
      ? settings.experience
      : DEFAULT_VOICE_SETTINGS.experience,

    autoSpeak: Boolean(settings.autoSpeak),

    collapseTranscript: Boolean(
      settings.collapseTranscript,
    ),

    speed: normalizeSpeed(settings.speed),
  };

  localStorage.setItem(
    VOICE_SETTINGS_KEY,
    JSON.stringify(normalizedSettings),
  );

  window.dispatchEvent(
    new CustomEvent(
      VOICE_SETTINGS_CHANGE_EVENT,
      {
        detail: normalizedSettings,
      },
    ),
  );

  return normalizedSettings;
}

export function updateVoiceSettings(
  updates: Partial<VoiceSettings>,
): VoiceSettings {
  const currentSettings = getVoiceSettings();

  return saveVoiceSettings({
    ...currentSettings,
    ...updates,
  });
}

export function resetVoiceSettings(): VoiceSettings {
  localStorage.removeItem(VOICE_SETTINGS_KEY);

  window.dispatchEvent(
    new CustomEvent(
      VOICE_SETTINGS_CHANGE_EVENT,
      {
        detail: DEFAULT_VOICE_SETTINGS,
      },
    ),
  );

  return DEFAULT_VOICE_SETTINGS;
}

export function subscribeToVoiceSettings(
  listener: (
    settings: VoiceSettings,
  ) => void,
): () => void {
  const handleSettingsChange = (
    event: Event,
  ) => {
    const customEvent =
      event as CustomEvent<VoiceSettings>;

    listener(
      customEvent.detail ?? getVoiceSettings(),
    );
  };

  const handleStorageChange = (
    event: StorageEvent,
  ) => {
    if (event.key === VOICE_SETTINGS_KEY) {
      listener(getVoiceSettings());
    }
  };

  window.addEventListener(
    VOICE_SETTINGS_CHANGE_EVENT,
    handleSettingsChange,
  );

  window.addEventListener(
    "storage",
    handleStorageChange,
  );

  return () => {
    window.removeEventListener(
      VOICE_SETTINGS_CHANGE_EVENT,
      handleSettingsChange,
    );

    window.removeEventListener(
      "storage",
      handleStorageChange,
    );
  };
}

export const studioVoiceOptions = [
  {
    id: "aria" as const,
    name: "Aria",
    description: "Calm · Professional · Female",
  },
  {
    id: "luna" as const,
    name: "Iris",
    description: "Creative · Friendly · Female",
  },
  {
    id: "ethan" as const,
    name: "Ethan",
    description: "Senior · Analytical · Male",
  },
];

export const voiceExperienceOptions = [
  {
    id: "voice-only" as const,
    name: "Voice Only",
    description:
      "Responses are spoken without displaying the transcript.",
    recommended: true,
  },
  {
    id: "voice-transcript" as const,
    name: "Voice + Transcript",
    description:
      "Responses are spoken and the transcript can be expanded.",
    recommended: false,
  },
  {
    id: "transcript-only" as const,
    name: "Transcript Only",
    description:
      "Responses appear as text without voice playback.",
    recommended: false,
  },
];