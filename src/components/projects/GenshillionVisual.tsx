import { ProductVisual } from './ProductVisual';

export function GenshillionVisual() {
  return (
    <ProductVisual
      board={{
        src: '/genshillion-desktop',
        width: 1902,
        height: 938,
        alt: 'Genshillion’s start screen in pixel art: the gold logo over a Mondstadt-style skyline, a card reading Dive #3 with seven prompts of twenty-five seconds each, a Start button, and streak, best, dives and last-score counters.',
      }}
      phone={{
        src: '/genshillion-phone',
        width: 375,
        height: 835,
        alt: 'The same start screen on a phone: logo, the Dive #3 card, a full-width Start button and the streak counters stacked above the fan-game disclaimer.',
      }}
    />
  );
}
