import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against third-party cross-origin widget script errors (such as Disqus / adblockers)
if (typeof window !== 'undefined') {
  window.onerror = function (message, source) {
    if (
      message === 'Script error.' ||
      (typeof message === 'string' && message.includes('Script error')) ||
      (source && source.includes('disqus'))
    ) {
      return true;
    }
    return false;
  };

  window.addEventListener(
    'error',
    (event) => {
      if (
        event.message === 'Script error.' ||
        (event.message && event.message.includes('Script error')) ||
        (event.filename && event.filename.includes('disqus'))
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (String(event.reason).includes('disqus') || String(event.reason).includes('Script error'))) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
