/** The current search (age + edition), kept in the address bar. */
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { readSearch, type Search, searchString } from './url.ts';

const EVENT = 'aya:navigate';

function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener);
  window.addEventListener(EVENT, listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener(EVENT, listener);
  };
}

export function useSearch(): [Search, (next: Search, options?: { replace?: boolean }) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => location.search,
    () => '',
  );
  const search = useMemo(() => readSearch(raw), [raw]);
  const navigate = useCallback((next: Search, options: { replace?: boolean } = {}) => {
    const query = searchString(next);
    if (query === location.search) return;
    const url = query || location.pathname;
    if (options.replace) history.replaceState(null, '', url);
    else history.pushState(null, '', url);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [search, navigate];
}
