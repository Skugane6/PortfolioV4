import buildInfo from 'virtual:build-info';
import { profile } from '../../content/profile';
import { sheetById } from '../../content/sheets';
import { LocalTime } from '../cover/LocalTime';
import { SheetFrame } from '../shell/SheetFrame';
import { ApprovalForm } from './ApprovalForm';
import { CopyEmail } from './CopyEmail';
import { PawMark } from './PawMark';

const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>;

/**
 * Sheet 05, approval. A drawing set ends with its sign-off block: drawn by,
 * checked by, approved by. Here the drafter has signed, the checker (the cat)
 * has stamped it, and the approval is the visitor's: getting in touch.
 */
export function Contact() {
  const { availability } = profile;
  const kb = Math.round(profile.resume.bytes / 1000);

  return (
    <SheetFrame sheet={sheetById.contact}>
      <div className="px-4 pb-12 pt-10 sm:px-8 lg:pl-16 lg:pr-12 lg:pt-16">
        <h2 id="contact-title" className="w-cond text-title font-bold">
          {sheetById.contact.title}
        </h2>
        <p className="mt-3 max-w-[56ch] text-body text-faded">
          Email is the quickest way to reach me. Or send a note from the approval block below and it comes straight to my inbox.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <CopyEmail email={profile.email} />
            <ul className="mt-8 border-t border-faded/50">
              {[
                { label: `Résumé (PDF, ${kb} KB)`, href: profile.resume.href, download: true },
                { label: profile.links.github.label, handle: profile.links.github.handle, href: profile.links.github.href },
                { label: profile.links.linkedin.label, handle: profile.links.linkedin.handle, href: profile.links.linkedin.href },
                { label: profile.links.crafttraq.label, handle: profile.links.crafttraq.handle, href: profile.links.crafttraq.href },
              ].map((l) => (
                <li key={l.href} className="border-b border-faded/50">
                  <a
                    href={l.href}
                    {...(l.download ? { download: true } : { target: '_blank', rel: 'noreferrer' })}
                    className="group flex min-h-[52px] items-center justify-between gap-4 py-2"
                  >
                    <span className="text-body text-blueprint group-hover:underline">{l.label}</span>
                    {l.handle && <span className="truncate text-small text-faded">{l.handle}</span>}
                    {!l.download && NEW_TAB}
                  </a>
                </li>
              ))}
            </ul>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 text-small">
              <div>
                <dt className="lettering text-label text-faded">Status</dt>
                {/* The HOLD on unconfirmed details is shown once, on the cover's title block. */}
                <dd className="mt-1 text-blueprint">
                  {availability.status}
                  {availability.seeking ? `: ${availability.seeking}` : ''}
                  {availability.from ? `, from ${availability.from}` : ''}
                </dd>
              </div>
              <div>
                <dt className="lettering text-label text-faded">Local time</dt>
                <dd className="mt-1 text-blueprint">
                  {profile.location.city} <LocalTime timeZone={profile.location.timeZone} />
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-7">
            <h3 className="sr-only">Sign-off</h3>
            <table className="ground w-full border-collapse text-small">
              <caption className="lettering pb-2 text-left text-label text-faded">Approval</caption>
              <tbody>
                <tr className="border border-faded/70">
                  <th scope="row" className="lettering w-[7.5rem] border-r border-faded/70 p-3 text-left align-top text-label font-medium text-faded">
                    Drawn
                  </th>
                  <td className="p-3 text-blueprint">
                    {profile.drafter}
                    <span className="figures ml-3 text-faded">{buildInfo.date}</span>
                  </td>
                </tr>
                <tr className="border border-faded/70">
                  <th scope="row" className="lettering border-r border-faded/70 p-3 text-left align-top text-label font-medium text-faded">
                    Checked
                  </th>
                  <td className="p-3">
                    <span className="flex items-center gap-3 text-blueprint">
                      <PawMark className="h-8 w-8" />
                      The checker (the cat on the cover)
                    </span>
                  </td>
                </tr>
                <tr className="border border-faded/70">
                  <th scope="row" className="lettering border-r border-faded/70 p-3 text-left align-top text-label font-medium text-faded">
                    Approved
                  </th>
                  <td className="p-3 sm:p-5">
                    <p className="mb-4 text-small text-faded">You. Send a note and I&rsquo;ll reply by email.</p>
                    <ApprovalForm to={profile.email} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SheetFrame>
  );
}
