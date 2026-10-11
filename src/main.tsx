import '@fontsource/anton/400.css';
import '@fontsource/unifrakturcook/700.css';
import '@fontsource-variable/fraunces/soft.css';
import '@fontsource-variable/newsreader/wght.css';
import './styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { applyTheme, getTheme } from './lib/theme.ts';
import { warmUp } from './lib/warmUp.ts';

applyTheme(getTheme());
// A shared link with an age searches right away.
if (new URLSearchParams(location.search).has('age')) warmUp();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
