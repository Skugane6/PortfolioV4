import { useCallback, useEffect, useRef, useState } from 'react';

const PATTERN = /^#projects\/([\w-]+)$/;

/**
 * Keeps the open case study in the URL (#projects/<id>) so a detail sheet can
 * be linked to, and Back closes it. Opening from the page pushes a history
 * entry; closing one opened that way goes back, closing one that arrived by
 * deep link replaces the hash instead (there is nothing to go back to).
 * Switching to another sheet while one is open replaces the entry, so one
 * Close (or one Back) always leaves the dialog.
 */
export function useCaseStudyRoute(ids: readonly string[]) {
  const [openId, setOpenIdState] = useState<string | null>(null);
  const current = useRef<string | null>(null);
  const pushed = useRef(false);
  const key = ids.join('|');
  const setOpenId = useCallback((id: string | null) => {
    current.current = id;
    setOpenIdState(id);
  }, []);

  useEffect(() => {
    const known = new Set(key.split('|'));
    const sync = () => {
      const match = location.hash.match(PATTERN);
      const id = match && known.has(match[1]) ? match[1] : null;
      if (!id) pushed.current = false;
      setOpenId(id);
    };
    sync();
    addEventListener('popstate', sync);
    addEventListener('hashchange', sync);
    return () => {
      removeEventListener('popstate', sync);
      removeEventListener('hashchange', sync);
    };
  }, [key, setOpenId]);

  const open = useCallback(
    (id: string) => {
      if (id === current.current) return;
      if (current.current) {
        history.replaceState(null, '', `#projects/${id}`);
      } else {
        history.pushState(null, '', `#projects/${id}`);
        pushed.current = true;
      }
      setOpenId(id);
    },
    [setOpenId],
  );

  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      history.back();
    } else {
      history.replaceState(null, '', `${location.pathname}${location.search}#projects`);
    }
    setOpenId(null);
  }, [setOpenId]);

  return { openId, open, close };
}
