import {
  Camera,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { saveAnalysisToHistory } from "../services/analysisHistory";
import {
  capturePrimaryDisplay,
  type ScreenCaptureResult,
} from "../services/screenCapture";
import { analyzeScreenCapture } from "../services/screenAnalysis";
import {
  uploadScreenCapture,
  type ScreenUploadResponse,
} from "../services/screenUpload";

type CaptureState =
  | "idle"
  | "capturing"
  | "captured"
  | "error";

type UploadState =
  | "idle"
  | "uploading"
  | "uploaded"
  | "error";

type AnalysisState =
  | "idle"
  | "analyzing"
  | "success"
  | "error";

export function ScreenCapturePage() {
  const navigate = useNavigate();

  const [captureState, setCaptureState] =
    useState<CaptureState>("idle");

  const [uploadState, setUploadState] =
    useState<UploadState>("idle");

  const [analysisState, setAnalysisState] =
    useState<AnalysisState>("idle");

  const [capture, setCapture] =
    useState<ScreenCaptureResult | null>(null);

  const [upload, setUpload] =
    useState<ScreenUploadResponse | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [
    uploadErrorMessage,
    setUploadErrorMessage,
  ] = useState<string | null>(null);

  const [
    analysisErrorMessage,
    setAnalysisErrorMessage,
  ] = useState<string | null>(null);

  const handleCaptureScreen = async () => {
    setCaptureState("capturing");
    setUploadState("idle");
    setAnalysisState("idle");

    setErrorMessage(null);
    setUploadErrorMessage(null);
    setAnalysisErrorMessage(null);

    setUpload(null);

    try {
      const result =
        await capturePrimaryDisplay();

      setCapture(result);
      setCaptureState("captured");

      try {
        setUploadState("uploading");

        const uploadResult =
          await uploadScreenCapture(
            result.dataUrl,
          );

        setUpload(uploadResult);
        setUploadState("uploaded");
      } catch (error) {
        setUploadState("error");

        setUploadErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to upload the screenshot.",
        );
      }
    } catch (error) {
      setCapture(null);
      setCaptureState("error");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to capture the primary display.",
      );
    }
  };

  const handleAnalyzeDesign = async () => {
    if (!capture) {
      return;
    }

    setAnalysisState("analyzing");
    setAnalysisErrorMessage(null);

    try {
      const analysisResult =
        await analyzeScreenCapture(
          capture.dataUrl,
        );

      saveAnalysisToHistory(
        analysisResult,
        capture.dataUrl,
      );

      setAnalysisState("success");

      navigate("/suggestions");
    } catch (error) {
      setAnalysisState("error");

      setAnalysisErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to analyze the screenshot.",
      );
    }
  };

  const captureLocked =
    captureState === "capturing" ||
    uploadState === "uploading";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-y-auto px-10 py-12 text-[var(--text-primary)]">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--accent-primary)]">
            Capture Input
          </p>

          <h1 className="mt-5 text-4xl font-semibold text-[var(--text-primary)]">
            Capture
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-[var(--text-secondary)]">
            Capture your screen, upload it
            securely, then send it to Studio PAP
            for AI review.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void handleCaptureScreen()
          }
          disabled={captureLocked}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] px-5 text-sm font-semibold text-[var(--button-text)] shadow-[0_0_30px_var(--theme-glow)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {captureLocked ? (
            <Loader2
              size={17}
              aria-hidden="true"
              className="animate-spin"
            />
          ) : (
            <Camera
              size={17}
              aria-hidden="true"
            />
          )}

          Capture Screen
        </button>
      </div>

      <div className="mt-10 rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-5 shadow-panel">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-primary)] pb-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Primary Display Snapshot
            </h2>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {capture
                ? `${capture.sourceName} - ${capture.width} × ${capture.height}`
                : "No screenshot captured yet."}
            </p>
          </div>

          <span className="rounded-lg border border-[var(--border-primary)] bg-[var(--background-soft)] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            {captureState}
          </span>
        </div>

        {capture ? (
          <div className="mt-5 rounded-xl border border-[var(--border-primary)] bg-[var(--background-secondary)] p-4 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center justify-between gap-4">
              <span>Upload Status</span>

              <span className="font-medium text-[var(--text-primary)]">
                {uploadState}
              </span>
            </div>

            {uploadState === "uploading" ? (
              <p className="mt-2 text-[var(--accent-primary)]">
                Uploading screenshot...
              </p>
            ) : null}

            {uploadState === "uploaded" &&
            upload ? (
              <div className="mt-3 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] p-3">
                <p className="font-medium text-[var(--accent-text)]">
                  Screenshot uploaded successfully
                </p>

                <p className="mt-1 text-[var(--text-primary)]">
                  Filename: {upload.filename}
                </p>

                <p className="mt-1 text-[var(--text-secondary)]">
                  {upload.message}
                </p>
              </div>
            ) : null}

            {uploadErrorMessage ? (
              <p className="mt-2 text-red-500">
                {uploadErrorMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        {capture &&
        uploadState === "uploaded" ? (
          <div className="mt-5 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Ready for AI Analysis
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Send this screenshot to Studio
                  PAP to generate scores, quick
                  wins, suggestions, and a top
                  priority.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleAnalyzeDesign()
                }
                disabled={
                  analysisState === "analyzing"
                }
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] px-5 text-sm font-semibold text-[var(--button-text)] shadow-[0_0_30px_var(--theme-glow)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {analysisState ===
                "analyzing" ? (
                  <Loader2
                    size={17}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <Sparkles
                    size={17}
                    aria-hidden="true"
                  />
                )}

                {analysisState ===
                "analyzing"
                  ? "Analyzing..."
                  : "Analyze Design"}
              </button>
            </div>

            {analysisErrorMessage ? (
              <p className="mt-3 text-sm text-red-500">
                {analysisErrorMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-500">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 flex min-h-[420px] items-center justify-center overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--background-secondary)]">
          {capture ? (
            <img
              src={capture.dataUrl}
              alt="Captured primary display"
              className="max-h-[620px] w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center text-center text-[var(--text-muted)]">
              <Camera
                size={38}
                aria-hidden="true"
              />

              <p className="mt-3 text-sm">
                Press Capture Screen to create a
                screenshot.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}