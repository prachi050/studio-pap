const API_BASE = "http://127.0.0.1:8000";

export type StudioVoice =
  | "aria"
  | "luna"
  | "ethan";

export interface VoiceSpeechRequest {
  text: string;
  voice: StudioVoice;
  speed?: number;
}

export async function generateVoiceSpeech(
  request: VoiceSpeechRequest,
): Promise<Blob> {
  const response = await fetch(
    `${API_BASE}/assistant/speech`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: request.text,
        voice: request.voice,
        speed: request.speed ?? 1,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      error || "Voice generation failed.",
    );
  }

  return await response.blob();
} 