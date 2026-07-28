import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@emotion/react';
import { theme } from './styles/theme';
import { registerOfflineCache } from './services/offlineCache';
import { startOfflineQueueSync } from './services/offlineQueue';
import './index.css';
import App from './App';

registerOfflineCache();
startOfflineQueueSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
