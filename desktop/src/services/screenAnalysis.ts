import { dataUrlToFile } from './screenUpload';
import { apiClient } from './apiClient';

export type ScreenAnalysisResponse = {
  status: 'success';

  screen_type: string;

  design_score: number;
  accessibility_score: number;
  hierarchy_score: number;
  typography_score: number;
  spacing_score: number;
  color_score: number;

  summary: string;

  suggestions: string[];

  quick_wins: string[];

  top_priority: string;
};

export async function analyzeScreenCapture(
  dataUrl: string
): Promise<ScreenAnalysisResponse> {
  const formData = new FormData();

  const screenshot = dataUrlToFile(
    dataUrl,
    `screen-analysis-${Date.now()}.png`
  );

  formData.append('screenshot', screenshot);

  const response = await apiClient.post<ScreenAnalysisResponse>(
    '/screen/analyze',
    formData,
    {
      timeout: 90000,
    }
  );

  return response.data;
}