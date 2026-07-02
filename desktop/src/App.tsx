import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { LiveAnalysisPage } from './pages/LiveAnalysisPage';
import { ScreenCapturePage } from './pages/ScreenCapturePage';
import { SettingsPage } from './pages/SettingsPage';
import { SuggestionsPage } from './pages/SuggestionsPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="live-analysis" element={<LiveAnalysisPage />} />
        <Route path="screen-capture" element={<ScreenCapturePage />} />
        <Route path="suggestions" element={<SuggestionsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
