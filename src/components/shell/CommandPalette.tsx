import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { profile } from '../../content/profile';
import { setMotionPreference, useReducedMotionPref } from '../../lib/motion';
import { ui, useUi } from '../../lib/ui';
import { goToSheet } from '../../lib/useActiveSheet';
import { useHydrated, useMedia } from '../../lib/useMedia';
import { buildCommands, filterCommands, type Command, type CommandContext } from './commands';

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/**
 * Ctrl/⌘ K (or "/") opens a command palette: jump to a sheet, open a
 * project's detail sheet, copy the email, download the résumé, open the
 * profiles, toggle motion or the crosshair, wake the cat. A native modal
 * dialog holding the ARIA combobox pattern: the input keeps focus and
 * aria-activedescendant points at the highlighted option.
 */
export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const crosshair = useUi((s) => s.crosshair);
  const reduced = useReducedMotionPref();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState('');
  const listId = useId();
  const finePointer = useMedia('(pointer: fine)', false);
  const hydrated = useHydrated();

  const commands = useMemo(() => buildCommands({ reduced, crosshair, finePointer }), [reduced, crosshair, finePointer]);
  const results = useMemo(() => filterCommands(commands, query), [commands, query]);

  // Global shortcuts.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable="true"]');
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (ui.get().paletteOpen) ui.closePalette();
        else ui.openPalette();
      } else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        ui.openPalette();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setActive(0);
      setNotice('');
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const ctx: CommandContext = {
    reduced,
    crosshair,
    finePointer,
    goToSheet: (id) => goToSheet(id, reduced),
    openProject: (id) => ui.requestProject(id),
    copyEmail: async () => {
      try {
        await navigator.clipboard.writeText(profile.email);
        return true;
      } catch {
        return false;
      }
    },
    download: (href) => {
      const a = document.createElement('a');
      a.href = href;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    openExternal: (href) => window.open(href, '_blank', 'noopener,noreferrer'),
    setReduced: (r) => setMotionPreference(r ? 'reduce' : 'full'),
    setCrosshair: (on) => ui.setCrosshair(on),
    wakeCat: () => {
      ui.wakeCat();
      goToSheet('cover', reduced);
    },
  };

  const run = async (cmd: Command) => {
    if (cmd.id === 'copy-email') {
      const ok = await ctx.copyEmail();
      setNotice(ok ? `Copied ${profile.email}` : `Couldn’t copy. The address is ${profile.email}`);
      if (ok) window.setTimeout(() => ui.closePalette(), 700);
      return;
    }
    // Close the dialog itself before running: while it is open the page is
    // inert, and a command that moves focus (to a sheet heading, a detail
    // sheet) would have nowhere to put it.
    returnTo.current = null;
    dialogRef.current?.close();
    ui.closePalette();
    await cmd.run(ctx);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(Math.max(0, results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = results[active];
      if (cmd) void run(cmd);
    }
  };

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!open) return;
    document.getElementById(`${listId}-${active}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [active, listId, open]);

  const shortcut = hydrated && isMac() ? '⌘K' : 'Ctrl K';
  const rows = results.map((cmd, i) => ({
    cmd,
    heading: !query.trim() && (i === 0 || results[i - 1].group !== cmd.group) ? cmd.group : null,
  }));

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      aria-label="Command palette"
      onClose={() => {
        ui.closePalette();
        returnTo.current?.focus();
        returnTo.current = null;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) ui.closePalette();
      }}
      className="mx-auto mt-[12vh] w-[min(640px,calc(100vw-24px))] border-2 border-blueprint bg-cyanotype p-0 text-blueprint backdrop:bg-cyanotype/80"
    >
      <div className="flex items-center gap-3 border-b border-faded/60 px-4">
        <span aria-hidden="true" className="font-mono text-data text-faded">
          &gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          aria-label="Command"
          placeholder="Jump to a sheet or run a command"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="min-h-[56px] flex-1 bg-transparent text-body text-blueprint outline-none placeholder:text-faded"
        />
        <kbd className="hidden border border-faded/60 px-1.5 font-mono text-label text-faded sm:inline">Esc</kbd>
      </div>

      <ul id={listId} role="listbox" aria-label="Commands" className="max-h-[min(60vh,440px)] overflow-y-auto py-2">
        {rows.map(({ cmd, heading }, i) => {
          return (
            <li key={cmd.id} role="presentation">
              {heading && (
                <p role="presentation" className="lettering px-4 pb-1 pt-3 text-label text-faded">
                  {heading}
                </p>
              )}
              <div
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                tabIndex={-1}
                onPointerMove={() => setActive(i)}
                onClick={() => void run(cmd)}
                onKeyDown={() => undefined}
                className={`mx-2 flex min-h-[44px] cursor-pointer items-center justify-between gap-4 px-3 text-small ${
                  i === active ? 'bg-blueprint/[0.08] outline outline-1 outline-redline' : ''
                }`}
              >
                <span>{cmd.label}</span>
                {cmd.hint && <span className="font-mono text-label text-faded">{cmd.hint}</span>}
              </div>
            </li>
          );
        })}
        {results.length === 0 && <li className="px-4 py-6 text-small text-faded">No matches. Try “email” or “résumé”.</li>}
      </ul>

      <p className="flex items-center justify-between gap-4 border-t border-faded/60 px-4 py-2 text-label text-faded">
        <span role="status">{notice}</span>
        <span className="hidden gap-4 sm:flex">
          <span><kbd className="font-mono">↑↓</kbd> choose</span>
          <span><kbd className="font-mono">Enter</kbd> run</span>
          <span><kbd className="font-mono">{shortcut}</kbd> close</span>
        </span>
      </p>
    </dialog>
  );
}

/** A visible way into the palette, for people who don't know the shortcut. */
export function PaletteButton({ className = '' }: { className?: string }) {
  const hydrated = useHydrated();
  const shortcut = hydrated && isMac() ? '⌘K' : 'Ctrl K';
  return (
    <button type="button" onClick={() => ui.openPalette()} className={`flex items-center gap-2 text-small text-faded hover:text-blueprint ${className}`}>
      Commands <kbd className="border border-faded/60 px-1.5 font-mono text-label">{shortcut}</kbd>
    </button>
  );
}
