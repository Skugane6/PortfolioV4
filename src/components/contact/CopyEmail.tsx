import { useEffect, useRef, useState } from 'react';

type State = 'idle' | 'copied' | 'manual';

/**
 * The address, always visible and selectable, with a copy button beside it.
 * Where the clipboard API is refused (insecure context, permissions), the
 * button selects the address instead and says how to copy it.
 */
export function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<State>('idle');
  const addressRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const settle = (next: State) => {
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 4000);
  };

  const selectAddress = () => {
    const el = addressRef.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('no clipboard');
      await navigator.clipboard.writeText(email);
      settle('copied');
    } catch {
      selectAddress();
      settle('manual');
    }
  };

  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const [local, domain] = email.split('@');

  return (
    <div>
      <p className="figures select-all break-words text-lead text-blueprint">
        <span ref={addressRef}>
          {local}@<wbr />
          {domain}
        </span>
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <a href={`mailto:${email}`} className="btn-primary">
          Email me
        </a>
        <button type="button" onClick={copy} className="btn-secondary">
          {state === 'copied' ? 'Copied to clipboard' : 'Copy address'}
        </button>
        <p role="status" className="text-small text-faded">
          {state === 'copied' && 'The address is on your clipboard.'}
          {state === 'manual' && `Address selected. Press ${mac ? '⌘' : 'Ctrl'}+C to copy.`}
        </p>
      </div>
    </div>
  );
}
