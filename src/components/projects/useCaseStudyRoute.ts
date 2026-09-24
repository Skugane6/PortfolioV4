import { useCallback, useEffect, useRef, useState } from 'react';

const PATTERN = /^#projects\/([\w-]+)$/;

/**
 * Keeps the open case study in the URL (#projects/<id>) so a detail sheet can
 * be linked to, and Back closes it. Opening from the page pushes a history
 * entry; closing one opened that way goes back, closing one that arrived by
 * deep link replaces the hash instead (there is nothing to go back to).
 */
export function useCaseStudyRoute(ids: readonly string[]) {
  const [openId, setOpenId] = useState<string | null>(null);
  const pushed = useRef(false);
  const key = ids.join('|');

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
  }, [key]);

  const open = useCallback((id: string) => {
    history.pushState(null, '', `#projects/${id}`);
    pushed.current = true;
    setOpenId(id);
  }, []);

  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      history.back();
    } else {
      history.replaceState(null, '', `${location.pathname}${location.search}#projects`);
    }
    setOpenId(null);
  }, []);

  return { openId, open, close };
}
