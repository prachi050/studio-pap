import { Camera, Loader2 } from 'lucide-react';
import { useState } from 'react';

import {
  capturePrimaryDisplay,
  type ScreenCaptureResult,
} from '../services/screenCapture';
import { analyzeScreenCapture, type ScreenAnalysisResponse } from '../services/screenAnalysis';
import { uploadScreenCapture, type ScreenUploadResponse } from '../services/screenUpload';

type CaptureState = 'idle' | 'capturing' | 'captured' | 'error';
type UploadState = 'idle' | 'uploading' | 'uploaded' | 'error';
type AnalysisState = 'idle' | 'analyzing' | 'success' | 'error';

export function ScreenCapturePage() {
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [capture, setCapture] = useState<ScreenCaptureResult | null>(null);
  const [upload, setUpload] = useState<ScreenUploadResponse | null>(null);
  const [analysis, setAnalysis] = useState<ScreenAnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [analysisErrorMessage, setAnalysisErrorMessage] = useState<string | null>(null);

  const handleCaptureScreen = async () => {
    setCaptureState('capturing');
    setUploadState('idle');
    setAnalysisState('idle');
    setErrorMessage(null);
    setUploadErrorMessage(null);
    setAnalysisErrorMessage(null);
    setUpload(null);
    setAnalysis(null);

    let result: ScreenCaptureResult;

    try {
      result = await capturePrimaryDisplay();
      setCapture(result);
      setCaptureState('captured');
    } catch (error) {
      setCapture(null);
      setCaptureState('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to capture the primary display.',
      );
      return;
    }

    try {
      setUploadState('uploading');
      const uploadResult = await uploadScreenCapture(result.dataUrl);
      setUpload(uploadResult);
      setUploadState('uploaded');
    } catch (error) {
      setUploadState('error');
      setUploadErrorMessage(
        error instanceof Error ? error.message : 'Unable to upload the screenshot.',
      );
    }

    try {
      setAnalysisState('analyzing');
      const analysisResult = await analyzeScreenCapture(result.dataUrl);
      setAnalysis(analysisResult);
      setAnalysisState('success');
    } catch (error) {
      setAnalysisState('error');
      setAnalysisErrorMessage(
        error instanceof Error ? error.message : 'Unable to analyze the screenshot.',
      );
    }
  };

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-y-auto px-10 py-12">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
            Capture Foundation
          </p>
          <h2 className="mt-5 text-4xl font-semibold text-white">Screen Capture</h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Capture one screenshot from the primary display.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCaptureScreen}
          disabled={
            captureState === 'capturing' ||
            uploadState === 'uploading' ||
            analysisState === 'analyzing'
          }
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {captureState === 'capturing' ||
          uploadState === 'uploading' ||
          analysisState === 'analyzing' ? (
            <Loader2 size={17} aria-hidden="true" className="animate-spin" />
          ) : (
            <Camera size={17} aria-hidden="true" />
          )}
          Capture Screen
        </button>
      </div>

      <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Primary Display Snapshot</h3>
            <p className="mt-1 text-sm text-slate-400">
              {capture
                ? `${capture.sourceName} - ${capture.width} x ${capture.height}`
                : 'No screenshot captured yet.'}
            </p>
          </div>

          <span className="rounded-lg border border-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            {captureState}
          </span>
        </div>

        {capture ? (
          <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <span>Upload Status</span>
              <span className="font-medium text-white">{uploadState}</span>
            </div>

            {uploadState === 'uploading' ? (
              <p className="mt-2 text-cyan-200">⬆️ Uploading screenshot...</p>
            ) : null}

            {uploadState === 'uploaded' && upload ? (
              <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3">
                <p className="font-medium text-emerald-200">
                  ✅ Screenshot uploaded successfully
                </p>
                <p className="mt-1 text-slate-300">Filename: {upload.filename}</p>
                <p className="mt-1 text-slate-400">{upload.message}</p>
              </div>
            ) : null}

            {uploadErrorMessage ? (
              <p className="mt-2 text-red-100">{uploadErrorMessage}</p>
            ) : null}
          </div>
        ) : null}

        {capture ? (
          <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
            {analysisState === 'analyzing' ? (
              <p className="font-medium text-white">👻 Looking closely...</p>
            ) : null}

            {analysis ? (
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">
                      Screen Type
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {analysis.screen_type}
                    </p>
                  </div>

                  <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">
                      Design Score
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {analysis.design_score}/100
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Top Priority
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      {analysis.top_priority}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-400">Accessibility</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {analysis.accessibility_score}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-400">Hierarchy</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {analysis.hierarchy_score}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-400">Typography</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {analysis.typography_score}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-400">Spacing</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {analysis.spacing_score}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-400">Color</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {analysis.color_score}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">Summary</h3>
                  <p className="mt-2 text-slate-300">{analysis.summary}</p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">Quick Wins</h3>
                  <ul className="mt-2 space-y-2 text-slate-300">
                    {analysis.quick_wins.map((win) => (
                      <li key={win} className="flex gap-2">
                        <span className="text-emerald-300">✓</span>
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">Suggestions</h3>
                  <ul className="mt-2 space-y-2 text-slate-300">
                    {analysis.suggestions.map((suggestion) => (
                      <li key={suggestion} className="flex gap-2">
                        <span className="text-cyan-300">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {analysisErrorMessage ? (
              <p className="text-red-100">{analysisErrorMessage}</p>
            ) : null}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 flex min-h-[420px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-950/70">
          {capture ? (
            <img
              src={capture.dataUrl}
              alt="Captured primary display"
              className="max-h-[620px] w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center text-center text-slate-500">
              <Camera size={38} aria-hidden="true" />
              <p className="mt-3 text-sm">Press Capture Screen to create a screenshot.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}