import type { SheetMeta } from './types';

/** The drawing set's sheet index. Order here is the page order and the nav order. */
export const sheets: SheetMeta[] = [
  { id: 'cover', number: 1, title: 'Cover', drawingTitle: 'Cover sheet' },
  { id: 'experience', number: 2, title: 'Experience', drawingTitle: 'Side elevation' },
  { id: 'projects', number: 3, title: 'Projects', drawingTitle: 'Detail drawings' },
  { id: 'skills', number: 4, title: 'Skills', drawingTitle: 'Assembly and bill of materials' },
  { id: 'contact', number: 5, title: 'Contact', drawingTitle: 'Approval' },
];

export const sheetById = Object.fromEntries(sheets.map((s) => [s.id, s])) as Record<SheetMeta['id'], SheetMeta>;

export const pad2 = (n: number) => String(n).padStart(2, '0');
