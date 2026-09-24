import { sheetById } from '../../content/sheets';
import { SheetFrame } from '../shell/SheetFrame';

// Stub: replaced by the full sheet in its own task (docs/overhaul/PLAN.md).
export function Contact() {
  const sheet = sheetById.contact;
  return (
    <SheetFrame sheet={sheet}>
      <div className="px-4 pb-24 pt-16 sm:px-6 lg:px-12">
        <h2 id="contact-title" className="w-cond text-title">
          {sheet.title}
        </h2>
      </div>
    </SheetFrame>
  );
}
