import buildInfo from 'virtual:build-info';
import { profile } from '../../content/profile';
import { useReducedMotionPref } from '../../lib/motion';
import { goToSheet } from '../../lib/useActiveSheet';

/**
 * The page's footer is the drawing set's revision block: the last three
 * revisions from git, the build, where the source is, and the way back to
 * the cover.
 */
export function RevisionBlock() {
  const reduced = useReducedMotionPref();
  return (
    <footer className="px-4 pb-10 pt-8 sm:px-8 lg:pl-16 lg:pr-12">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <table className="ground w-full border-collapse text-small">
            <caption className="lettering pb-2 text-left text-label text-faded">Revisions</caption>
            <thead>
              <tr className="border border-faded/70 text-left">
                <th scope="col" className="lettering w-[6rem] border-r border-faded/70 px-3 py-2 text-label font-medium text-faded">
                  Rev
                </th>
                <th scope="col" className="lettering w-[7.5rem] border-r border-faded/70 px-3 py-2 text-label font-medium text-faded">
                  Date
                </th>
                <th scope="col" className="lettering px-3 py-2 text-label font-medium text-faded">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {buildInfo.revisions.length > 0 ? (
                buildInfo.revisions.map((r) => (
                  <tr key={r.hash} className="border border-faded/70">
                    <td className="border-r border-faded/70 px-3 py-2 font-mono text-data text-blueprint">{r.hash}</td>
                    <td className="border-r border-faded/70 px-3 py-2 font-mono text-data text-faded">{r.date}</td>
                    <td className="px-3 py-2 text-blueprint">{r.subject}</td>
                  </tr>
                ))
              ) : (
                <tr className="border border-faded/70">
                  <td className="px-3 py-2 font-mono text-data text-blueprint">{buildInfo.hash}</td>
                  <td className="px-3 py-2 font-mono text-data text-faded">{buildInfo.date}</td>
                  <td className="px-3 py-2 text-faded">Revision history unavailable in this build.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col justify-between gap-6 lg:col-span-4">
          <ul className="space-y-2 text-small">
            <li>
              <a className="link text-blueprint" href={profile.links.source.href} target="_blank" rel="noreferrer">
                {profile.links.source.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <a
                className="link text-blueprint"
                href="#cover"
                onClick={(e) => {
                  e.preventDefault();
                  goToSheet('cover', reduced);
                }}
              >
                Back to the cover
              </a>
            </li>
          </ul>
          <p className="text-label text-faded">
            Designed and built by {profile.name}. Build <span className="font-mono">{buildInfo.hash}</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
