import type { ScreenAnalysisResponse } from './screenAnalysis';

const HISTORY_KEY = 'ghost-designer-analysis-history';

export type SavedAnalysis = ScreenAnalysisResponse & {
  id: string;
  captured_at: string;
  screenshot_data_url: string;
};

export function getAnalysisHistory(): SavedAnalysis[] {
  const rawHistory = localStorage.getItem(HISTORY_KEY);

  if (!rawHistory) {
    return [];
  }

  try {
    return JSON.parse(rawHistory) as SavedAnalysis[];
  } catch {
    return [];
  }
}

export function saveAnalysisToHistory(
  analysis: ScreenAnalysisResponse,
  screenshotDataUrl: string,
): SavedAnalysis {
  const savedAnalysis: SavedAnalysis = {
    ...analysis,
    id: crypto.randomUUID(),
    captured_at: new Date().toISOString(),
    screenshot_data_url: screenshotDataUrl,
  };

  const currentHistory = getAnalysisHistory();

  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify([savedAnalysis, ...currentHistory].slice(0, 50)),
  );

  return savedAnalysis;
}

export function clearAnalysisHistory() {
  localStorage.removeItem(HISTORY_KEY);
}