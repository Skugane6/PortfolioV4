import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Western ships its horizontal lockup as white artwork burned onto a solid
// purple plate. The hero is a monochrome scene on near-black, where a purple
// rectangle is the only saturated block on the page, so this lifts the
// artwork off its plate and keeps just the white, on transparency.
//
// A colour-key would leave purple fringing on every antialiased edge. Instead
// each pixel is read as a blend between the plate and white, and that blend
// factor becomes the alpha: t = (channel - plate) / (255 - plate). The green
// channel carries the most range between the two (38 -> 255), so it gives the
// cleanest edges. RGB is then flattened to white everywhere, which is what
// makes the result tintable by the page rather than locked to one ground.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, '..', 'public', 'Western2.png');
const output = path.join(__dirname, '..', 'public', 'western-mark.png');

// The plate colour, sampled from the source's corner.
const PLATE_GREEN = 38;

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const out = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i += 4) {
  const t = (data[i + 1] - PLATE_GREEN) / (255 - PLATE_GREEN);
  out[i] = 255;
  out[i + 1] = 255;
  out[i + 2] = 255;
  // The source's own alpha still gates the result, so a transparent input
  // pixel cannot be resurrected by a coincidental green value.
  out[i + 3] = Math.round(Math.max(0, Math.min(1, t)) * data[i + 3]);
}

await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  // Trim the plate's generous margin so the mark's own box is its artwork,
  // otherwise every consumer has to compensate for the padding by hand.
  .trim()
  .toFile(output);

console.log(`Wrote ${output}`);
