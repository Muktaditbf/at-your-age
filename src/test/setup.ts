import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom has no layout: give it the few browser APIs the components call.
Element.prototype.scrollTo ??= function scrollTo() {};
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

// Vitest runs without globals, so Testing Library can't clean up on its own.
afterEach(() => {
  cleanup();
});
