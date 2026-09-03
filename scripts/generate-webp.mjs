import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, '..', 'public', 'crafttraq.png');
const output = path.join(__dirname, '..', 'public', 'crafttraq.webp');

await sharp(input).webp({ quality: 82 }).toFile(output);
console.log(`Wrote ${output}`);
