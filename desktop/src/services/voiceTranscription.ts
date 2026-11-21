const API_BASE = "http://127.0.0.1:8000";

export type VoiceTranscriptionResponse = {
  transcript: string;
  language: string;
};

export async function transcribeVoice(
  audioBlob: Blob,
): Promise<string> {
  const form = new FormData();

  const extension =
    audioBlob.type.includes("mp4") ? "m4a" : "webm";

  form.append(
    "audio",
    audioBlob,
    `recording.${extension}`,
  );

  form.append("language", "en");

  const response = await fetch(
    `${API_BASE}/voice/transcribe`,
    {
      method: "POST",
      body: form,
    },
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      text || "Voice transcription failed.",
    );
  }

  const data =
    (await response.json()) as VoiceTranscriptionResponse;

  if (!data.transcript?.trim()) {
    throw new Error(
      "The transcription service returned no text.",
    );
  }

  return data.transcript.trim();
}