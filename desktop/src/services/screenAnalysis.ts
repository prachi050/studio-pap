import { dataUrlToFile } from './screenUpload';
import { apiClient } from './apiClient';

export type ScreenAnalysisResponse = {
  status: 'success';
  summary: string;
  suggestions: string[];
};

export async function analyzeScreenCapture(dataUrl: string): Promise<ScreenAnalysisResponse> {
  const formData = new FormData();
  const screenshot = dataUrlToFile(dataUrl, `screen-analysis-${Date.now()}.png`);

  formData.append('screenshot', screenshot);

  const response = await apiClient.post<ScreenAnalysisResponse>('/screen/analyze', formData, {
    timeout: 90000,
  });
  return response.data;
}
