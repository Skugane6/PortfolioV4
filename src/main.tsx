import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import './design/index.css';

const root = document.getElementById('root')!;
const fixture = import.meta.env.DEV ? new URLSearchParams(location.search).get('fixture') : null;

if (fixture) {
  // Dev-only isolated renders for screenshots (src/dev/Fixtures.tsx).
  import('./dev/Fixtures').then(({ Fixtures }) => createRoot(root).render(<Fixtures name={fixture} />));
} else {
  const app = (
    <StrictMode>
      <App />
    </StrictMode>
  );
  // The production build prerenders the page into #root (scripts/prerender.mjs),
  // so the name and lede paint before any script runs; hydrate that markup.
  // The dev server serves an empty root, so render from scratch there.
  if (root.hasChildNodes()) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
