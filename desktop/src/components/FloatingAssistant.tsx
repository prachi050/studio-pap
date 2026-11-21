import {
  useEffect,
  useRef,
  useState,
} from "react";

import { FloatingPanel } from "./FloatingPanel";
import { useFloatingAssistant } from "../hooks/useFloatingAssistant";
import { transcribeVoice } from "../services/voiceTranscription";
import { askAssistant } from "../services/assistantChat";
import { generateVoiceSpeech } from "../services/voiceSpeech";

type ElectronResult = {
  ok: boolean;
};

type ScreenCaptureResult = {
  dataUrl: string;
  sourceName: string;
  displayId: string;
  width: number;
  height: number;
};

type GhostDesignerApi = {
  floating?: {
    hide: () => Promise<ElectronResult>;
    minimize: () => Promise<ElectronResult>;
    openMainApp: () => Promise<ElectronResult>;
  };

  screen?: {
    capturePrimary: () => Promise<ScreenCaptureResult>;
  };
};

function getElectronApi(): GhostDesignerApi | undefined {
  return (
    window as Window & {
      ghostDesigner?: GhostDesignerApi;
    }
  ).ghostDesigner;
}

export function FloatingAssistant() {
  const assistant = useFloatingAssistant({
    initialOpen: true,
    initialPosition: {
      x: 0,
      y: 0,
    },
    screenPadding: 0,
  });

  const [transcript, setTranscript] =
    useState("");

  const [response, setResponse] =
    useState("");

  const [isListening, setIsListening] =
    useState(false);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const responseAudioRef =
    useRef<HTMLAudioElement | null>(null);

  const responseAudioUrlRef =
    useRef<string | null>(null);

  // Keeps the most recently analyzed screen available for voice follow-ups.
  // Refs are used so the latest values are available inside recorder callbacks.
  const lastScreenImageRef =
    useRef<File | null>(null);

  const lastScreenAnalysisRef =
    useRef<string | null>(null);

  const cleanAssistantText = (text: string) => {
    return text
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/^\s*[-*•]\s+/gm, "")
      .replace(/^\s*\d+[.)]\s+/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const stopMicrophoneStream = () => {
    mediaStreamRef.current
      ?.getTracks()
      .forEach((track) => {
        track.stop();
      });

    mediaStreamRef.current = null;
  };

  const stopResponseAudio = () => {
    if (responseAudioRef.current) {
      responseAudioRef.current.pause();
      responseAudioRef.current.src = "";
      responseAudioRef.current = null;
    }

    if (responseAudioUrlRef.current) {
      URL.revokeObjectURL(
        responseAudioUrlRef.current,
      );

      responseAudioUrlRef.current = null;
    }
  };

  const speakReply = async (
    text: string,
  ) => {
    stopResponseAudio();

    assistant.startSpeaking();

    const speechText =
      cleanAssistantText(text).slice(0, 3500);

    const speechBlob =
      await generateVoiceSpeech({
        text: speechText,
        voice: "aria",
        speed: 1,
      });

    if (speechBlob.size === 0) {
      throw new Error(
        "Aria generated an empty audio response.",
      );
    }

    const audioUrl =
      URL.createObjectURL(speechBlob);

    responseAudioUrlRef.current =
      audioUrl;

    const audio =
      new Audio(audioUrl);

    responseAudioRef.current =
      audio;

    audio.preload = "auto";

    await new Promise<void>(
      (resolve, reject) => {
        audio.onended = () => {
          resolve();
        };

        audio.onerror = () => {
          reject(
            new Error(
              "Aria generated speech, but the audio could not be played.",
            ),
          );
        };

        audio.play().catch(reject);
      },
    );

    stopResponseAudio();
  };

  const processRecordedAudio =
    async () => {
      try {
        assistant.startThinking();

        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type: "audio/webm",
          },
        );

        console.log(
          "Recorded audio blob:",
          {
            size: audioBlob.size,
            type: audioBlob.type,
            chunks:
              audioChunksRef.current.length,
          },
        );

        if (audioBlob.size === 0) {
          throw new Error(
            "No audio was recorded. Please try again.",
          );
        }

        const text =
          await transcribeVoice(
            audioBlob,
          );

        const cleanedText =
          text.trim();

        if (!cleanedText) {
          throw new Error(
            "I could not hear anything clearly. Please try again.",
          );
        }

        setTranscript(cleanedText);

        const rememberedImage =
          lastScreenImageRef.current;

        const rememberedAnalysis =
          lastScreenAnalysisRef.current;

        const followUpQuestion =
          rememberedImage && rememberedAnalysis
            ? `
You previously reviewed the same interface shown in the attached image.

Your previous review was:
${rememberedAnalysis}

The user is continuing that same design conversation.
Answer this follow-up question about the attached interface:
${cleanedText}

Respond naturally as Aria, a senior product designer.
Do not use markdown, headings, bullet points, or numbered lists.
Do not say that you cannot see the screenshot because it is attached.
Do not repeat the full previous review.
Answer the user's exact question first and keep the response under 120 words.
`.trim()
            : `
Answer this design-related question naturally as Aria, a senior product designer:
${cleanedText}

Do not use markdown, headings, bullet points, or numbered lists.
Keep the response conversational and under 120 words.
`.trim();

        const aiReply =
          await askAssistant({
            question: followUpQuestion,
            latest_analysis:
              rememberedAnalysis
                ? {
                    previous_screen_analysis:
                      rememberedAnalysis,
                  }
                : null,
            image: rememberedImage,
          });

        const cleanedReply =
          cleanAssistantText(aiReply);

        if (!cleanedReply) {
          throw new Error(
            "Aria did not return a response.",
          );
        }

        setResponse(cleanedReply);

        try {
          await speakReply(
            cleanedReply,
          );
        } catch (speechError) {
          console.error(
            "Voice playback failed:",
            speechError,
          );

          setResponse(
            `${cleanedReply}\n\nVoice playback failed.`,
          );
        }

        assistant.resetStatus();
      } catch (error) {
        console.error(
          "Voice assistant failed:",
          error,
        );

        setResponse(
          error instanceof Error
            ? error.message
            : "The voice assistant request failed.",
        );

        assistant.resetStatus();
      } finally {
        setIsListening(false);

        audioChunksRef.current = [];
        mediaRecorderRef.current = null;

        stopMicrophoneStream();
      }
    };

  const handleStartListening =
    async () => {
      try {
        stopResponseAudio();

        setTranscript("");
        setResponse("");
        setIsListening(true);

        assistant.startListening();

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

        mediaStreamRef.current =
          stream;

        audioChunksRef.current =
          [];

        let recorder:
          MediaRecorder;

        const opusMimeType =
          "audio/webm;codecs=opus";

        const webmMimeType =
          "audio/webm";

        if (
          MediaRecorder.isTypeSupported(
            opusMimeType,
          )
        ) {
          recorder =
            new MediaRecorder(
              stream,
              {
                mimeType:
                  opusMimeType,
                audioBitsPerSecond:
                  128000,
              },
            );
        } else if (
          MediaRecorder.isTypeSupported(
            webmMimeType,
          )
        ) {
          recorder =
            new MediaRecorder(
              stream,
              {
                mimeType:
                  webmMimeType,
                audioBitsPerSecond:
                  128000,
              },
            );
        } else {
          recorder =
            new MediaRecorder(
              stream,
            );
        }

        mediaRecorderRef.current =
          recorder;

        recorder.onstart = () => {
          console.log(
            "🎤 Recording started:",
            recorder.mimeType,
          );
        };

        recorder.ondataavailable = (
          event,
        ) => {
          if (
            event.data &&
            event.data.size > 0
          ) {
            audioChunksRef.current.push(
              event.data,
            );

            console.log(
              "Audio chunk received:",
              event.data.size,
            );
          }
        };

        recorder.onerror = (
          event,
        ) => {
          console.error(
            "MediaRecorder error:",
            event,
          );

          setIsListening(false);

          setResponse(
            "An error occurred while recording your voice.",
          );

          stopMicrophoneStream();
          assistant.resetStatus();
        };

        recorder.onstop = () => {
          console.log(
            "🛑 MediaRecorder stopped",
          );

          void processRecordedAudio();
        };

        /*
         * Creates a valid audio chunk every
         * 250 milliseconds.
         */
        recorder.start(250);
      } catch (error) {
        console.error(
          "Could not start microphone:",
          error,
        );

        setIsListening(false);

        setResponse(
          error instanceof Error
            ? error.message
            : "Could not access the microphone.",
        );

        stopMicrophoneStream();
        assistant.resetStatus();
      }
    };

  const handleStopListening =
    () => {
      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state === "recording"
      ) {
        setIsListening(false);

        /*
         * Do not call recorder.requestData().
         * recorder.stop() automatically sends
         * the final recorded audio chunk.
         */
        recorder.stop();

        console.log(
          "🛑 Recording stop requested",
        );

        return;
      }

      setIsListening(false);
      stopMicrophoneStream();
      assistant.resetStatus();

      console.warn(
        "No active recording was found.",
      );
    };
    const handleAnalyzeScreen = async () => {
      assistant.startThinking();
    
      setTranscript("");
      setResponse("");
    
      try {
        const electronApi = getElectronApi();
    
        if (!electronApi?.screen?.capturePrimary) {
          throw new Error(
            "Screen capture is unavailable.",
          );
        }
    
        const capture =
  await electronApi.screen.capturePrimary();

console.log("Capture:", capture);

const link = document.createElement("a");
link.href = capture.dataUrl;
link.download = "captured-screen.png";
link.click();

        console.log(
          "📷 Screen captured:",
          capture.sourceName,
          capture.width,
          capture.height,
        );
    
        if (!capture.dataUrl) {
          throw new Error(
            "The captured screen image was empty.",
          );
        }
    
        const imageResponse = await fetch(
          capture.dataUrl,
        );
    
        const imageBlob =
          await imageResponse.blob();
    
        const imageFile = new File(
          [imageBlob],
          "screen-capture.png",
          {
            type:
              imageBlob.type ||
              "image/png",
          },
        );
    
        const analysisReply =
  await askAssistant({
    question: `
You are Aria, Studio PAP's senior AI product designer.

Analyze only the attached screenshot.

Focus on the largest visible application or page in the screenshot.

If Figma is visible, review only the Figma design.
If a website is visible, review only that website.
If Studio PAP is visible, review only Studio PAP.
Do not use previous screenshots or previous screen memory.

Ignore the small Studio PAP floating assistant overlay unless the user specifically asks you to review it.

Do not describe applications, pages, icons, or interface elements that are not clearly visible.

If multiple apps are visible, focus only on the largest visible application.

Give a concise overall impression. Then explain the three biggest improvements that would make the visible interface clearer, more usable, or more polished. Mention one visible design choice that is working well.

Finish with exactly:
Design score: X/10

Base every point only on what is visible in the current screenshot.
Do not use markdown, headings, bullet points, numbered lists, symbols, or hashtags.
Keep the entire response between 100 and 150 words.
`.trim(),
    latest_analysis: null,
    image: imageFile,
  });
        const cleanedReply =
          cleanAssistantText(analysisReply);
    
        if (!cleanedReply) {
          throw new Error(
            "Aria did not return any screen feedback.",
          );
        }
    
        // Replace the remembered screen whenever a new analysis succeeds.
        lastScreenImageRef.current = imageFile;
        lastScreenAnalysisRef.current = cleanedReply;

        setResponse(cleanedReply);
    
        try {
          await speakReply(
            cleanedReply,
          );
        } catch (speechError) {
          console.error(
            "Screen analysis voice playback failed:",
            speechError,
          );
        }
    
        assistant.resetStatus();
      } catch (error) {
        console.error(
          "Screen analysis failed:",
          error,
        );
    
        setResponse(
          error instanceof Error
            ? error.message
            : "Screen analysis failed.",
        );
    
        assistant.resetStatus();
      }
    };


  const handleOpenMainApp =
    async () => {
      try {
        const electronApi =
          getElectronApi();

        await electronApi?.floating
          ?.openMainApp();

        console.log(
          "Opened Studio PAP",
        );
      } catch (error) {
        console.error(
          "Could not open Studio PAP:",
          error,
        );
      }
    };

  const handleClose = async () => {
    try {
      stopResponseAudio();

      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state === "recording"
      ) {
        recorder.stop();
      } else {
        stopMicrophoneStream();
      }

      const electronApi =
        getElectronApi();

      if (
        electronApi?.floating?.hide
      ) {
        await electronApi.floating.hide();
        return;
      }

      assistant.close();
    } catch (error) {
      console.error(
        "Could not close floating assistant:",
        error,
      );

      assistant.close();
    }
  };

  const handleMinimize =
    async () => {
      try {
        const electronApi =
          getElectronApi();

        if (
          electronApi?.floating
            ?.minimize
        ) {
          await electronApi.floating.minimize();
          return;
        }

        assistant.toggle();
      } catch (error) {
        console.error(
          "Could not minimize floating assistant:",
          error,
        );

        assistant.toggle();
      }
    };

  useEffect(() => {
    return () => {
      stopResponseAudio();

      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state === "recording"
      ) {
        recorder.stop();
      } else {
        stopMicrophoneStream();
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "10px",
        background: "transparent",
        zIndex: 999999,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <FloatingPanel
          status={assistant.status}
          isListening={isListening}
          transcript={transcript}
          response={response}
          onClose={handleClose}
          onMinimize={
            handleMinimize
          }
          onStartListening={
            handleStartListening
          }
          onStopListening={
            handleStopListening
          }
          onAnalyzeScreen={
            handleAnalyzeScreen
          }
          onOpenMainApp={
            handleOpenMainApp
          }
        />
      </div>
    </div>
  );
}