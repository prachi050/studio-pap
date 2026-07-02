import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 5000,
});

export type BackendStatusResponse = {
  status: string;
  project: string;
};

export async function getBackendStatus(): Promise<BackendStatusResponse> {
  const response = await apiClient.get<BackendStatusResponse>('/');
  return response.data;
}
