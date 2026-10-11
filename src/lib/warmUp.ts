/**
 * Opens connections to the servers a search needs, a moment before the search.
 * Only called once a search is on its way (typing an age, or a link with an age),
 * so just visiting the page contacts nobody.
 */
const ORIGINS = ['https://qlever.dev', 'https://en.wikipedia.org', 'https://thumb.wikimedia.org'];
let done = false;

export function warmUp() {
  if (done || typeof document === 'undefined') return;
  done = true;
  for (const href of ORIGINS) {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.append(link);
  }
}
