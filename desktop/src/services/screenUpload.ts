import { apiClient } from './apiClient';

export type ScreenUploadResponse = {
  status: 'uploaded';
  filename: string;
  message: string;
};

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [metadata, base64Data] = dataUrl.split(',');
  if (!metadata || !base64Data) {
    throw new Error('Captured screenshot data is not a valid image.');
  }

  const contentType = metadata.match(/data:(.*);base64/)?.[1] ?? 'image/png';
  const binaryString = window.atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  return new File([bytes], filename, { type: contentType });
}

export async function uploadScreenCapture(dataUrl: string): Promise<ScreenUploadResponse> {
  const formData = new FormData();
  const screenshot = dataUrlToFile(dataUrl, `screen-capture-${Date.now()}.png`);

  formData.append('screenshot', screenshot);

  const response = await apiClient.post<ScreenUploadResponse>('/screen/upload', formData);
  return response.data;
}
