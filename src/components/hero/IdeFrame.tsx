import { IdeWindow } from './IdeWindow';

/**
 * The IDE plus the scene's registration chrome: an inset hairline box and
 * four corner brackets.
 *
 * Size-agnostic: it fills whatever box the caller establishes, so the same
 * treatment serves the 470x330 slot inside HeroStage's fixed coordinate
 * space and the fluid tablet slot in Hero. The caller must be positioned
 * (the frame and brackets are absolute against it) and must leave ~22px of
 * outer margin, or the brackets clip.
 *
 * Decorative throughout: callers are responsible for the aria-hidden.
 */
export function IdeFrame() {
  return (
    <>
      <div
        className="absolute rounded-[10px]"
        style={{ inset: -14, border: '1px solid rgba(96,150,245,.16)' }}
      />
      <div
        className="absolute h-3.5 w-3.5"
        style={{ left: -22, top: -22, borderLeft: '1px solid #6f9dee', borderTop: '1px solid #6f9dee' }}
      />
      <div
        className="absolute h-3.5 w-3.5"
        style={{ right: -22, top: -22, borderRight: '1px solid #6f9dee', borderTop: '1px solid #6f9dee' }}
      />
      <div
        className="absolute h-3.5 w-3.5"
        style={{ left: -22, bottom: -22, borderLeft: '1px solid #6f9dee', borderBottom: '1px solid #6f9dee' }}
      />
      <div
        className="absolute h-3.5 w-3.5"
        style={{ right: -22, bottom: -22, borderRight: '1px solid #6f9dee', borderBottom: '1px solid #6f9dee' }}
      />
      <IdeWindow />
    </>
  );
}
