import { Camera, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  capturePrimaryDisplay,
  type ScreenCaptureResult,
} from '../services/screenCapture';
import { analyzeScreenCapture } from '../services/screenAnalysis';
import { saveAnalysisToHistory } from '../services/analysisHistory';
import { uploadScreenCapture, type ScreenUploadResponse } from '../services/screenUpload';

type CaptureState = 'idle' | 'capturing' | 'captured' | 'error';
type UploadState = 'idle' | 'uploading' | 'uploaded' | 'error';
type AnalysisState = 'idle' | 'analyzing' | 'success' | 'error';

export function ScreenCapturePage() {
  const navigate = useNavigate();

  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [capture, setCapture] = useState<ScreenCaptureResult | null>(null);
  const [upload, setUpload] = useState<ScreenUploadResponse | null>(null);
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

    try {
      const result = await capturePrimaryDisplay();

      setCapture(result);
      setCaptureState('captured');

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
    } catch (error) {
      setCapture(null);
      setCaptureState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to capture the primary display.',
      );
    }
  };

  const handleAnalyzeDesign = async () => {
    if (!capture) return;

    setAnalysisState('analyzing');
    setAnalysisErrorMessage(null);

    try {
      const analysisResult = await analyzeScreenCapture(capture.dataUrl);

      saveAnalysisToHistory(analysisResult, capture.dataUrl);

      setAnalysisState('success');
      navigate('/suggestions');
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
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#00D97E]">
            Capture Input
          </p>
          <h2 className="mt-5 text-4xl font-semibold text-[#F1F5F9]">Capture</h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Capture your screen, upload it securely, then send it to Studio PAP for AI review.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCaptureScreen}
          disabled={captureState === 'capturing' || uploadState === 'uploading'}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#00D97E] px-5 text-sm font-semibold text-[#050608] shadow-[0_0_30px_rgba(0,217,126,0.25)] transition hover:bg-[#16F28B] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {captureState === 'capturing' || uploadState === 'uploading' ? (
            <Loader2 size={17} aria-hidden="true" className="animate-spin" />
          ) : (
            <Camera size={17} aria-hidden="true" />
          )}
          Capture Screen
        </button>
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-panel">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-semibold text-[#F1F5F9]">
              Primary Display Snapshot
            </h3>
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
          <div className="mt-5 rounded-xl border border-white/10 bg-[#050608]/60 p-4 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <span>Upload Status</span>
              <span className="font-medium text-[#F1F5F9]">{uploadState}</span>
            </div>

            {uploadState === 'uploading' ? (
              <p className="mt-2 text-[#7CFFB2]">Uploading screenshot...</p>
            ) : null}

            {uploadState === 'uploaded' && upload ? (
              <div className="mt-3 rounded-lg border border-[#00D97E]/30 bg-[#00D97E]/10 p-3">
                <p className="font-medium text-[#7CFFB2]">
                  Screenshot uploaded successfully
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

        {capture && uploadState === 'uploaded' ? (
          <div className="mt-5 rounded-xl border border-[#00D97E]/20 bg-[#00D97E]/10 p-5">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h3 className="text-base font-semibold text-[#F1F5F9]">
                  Ready for AI Analysis
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  Send this screenshot to Studio PAP to generate scores, quick wins,
                  suggestions, and a top priority.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAnalyzeDesign}
                disabled={analysisState === 'analyzing'}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#00D97E] px-5 text-sm font-semibold text-[#050608] shadow-[0_0_30px_rgba(0,217,126,0.25)] transition hover:bg-[#16F28B] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {analysisState === 'analyzing' ? (
                  <Loader2 size={17} aria-hidden="true" className="animate-spin" />
                ) : (
                  <Sparkles size={17} aria-hidden="true" />
                )}
                {analysisState === 'analyzing' ? 'Analyzing...' : 'Analyze Design'}
              </button>
            </div>

            {analysisErrorMessage ? (
              <p className="mt-3 text-sm text-red-100">{analysisErrorMessage}</p>
            ) : null}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 flex min-h-[420px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#050608]/70">
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