import { profile } from '../../content/profile';
import { sheetById } from '../../content/sheets';
import { SheetFrame } from '../shell/SheetFrame';

// Stub: replaced by the full cover sheet in Task 3.
export function Cover() {
  return (
    <SheetFrame sheet={sheetById.cover}>
      <div className="px-4 pb-24 pt-16 sm:px-6 lg:px-12">
        <h1 id="cover-title" className="w-cond text-display font-bold">
          {profile.name}
        </h1>
      </div>
    </SheetFrame>
  );
}
