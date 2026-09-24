import { useId, useRef, useState, type FormEvent } from 'react';
import { m } from 'motion/react';
import { LIMITS, mailtoFor, validateContact, type ContactErrors, type ContactField, type ContactInput } from '../../lib/contactForm';
import { spring } from '../../lib/motion';
import { Stamp } from '../drawing/Stamp';

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'fallback'; href: string };

const FIELDS: { name: ContactField; label: string; type: 'text' | 'email' | 'textarea'; autoComplete: string }[] = [
  { name: 'name', label: 'Name', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'message', label: 'Message', type: 'textarea', autoComplete: 'off' },
];

/**
 * The APPROVED cell's form. Posts to /api/contact; when that route isn't
 * configured (or the network fails) it opens the visitor's mail app with the
 * message filled in and says so, so a message is never lost.
 */
export function ApprovalForm({ to }: { to: string }) {
  const [values, setValues] = useState<ContactInput>({ name: '', email: '', message: '', company: '' });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);
  const base = useId();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateContact(values);
    setErrors(found);
    const first = FIELDS.find((f) => found[f.name]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first.name}"]`)?.focus();
      return;
    }
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        setStatus({ kind: 'sent' });
        return;
      }
      if (res.status === 400) {
        const body = (await res.json().catch(() => ({}))) as { errors?: ContactErrors };
        if (body.errors) {
          setErrors(body.errors);
          setStatus({ kind: 'idle' });
          return;
        }
      }
      throw new Error(`status ${res.status}`);
    } catch {
      const href = mailtoFor(to, values);
      setStatus({ kind: 'fallback', href });
      window.location.href = href;
    }
  };

  if (status.kind === 'sent') {
    return (
      <div role="status" className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <m.div initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.ui}>
          <Stamp lines={['Approved', 'Thank you']} tilt={-4} />
        </m.div>
        <p className="text-body text-blueprint">Sent. I&rsquo;ll reply from {to}.</p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
      {FIELDS.map((f) => {
        const id = `${base}-${f.name}`;
        const errorId = `${id}-error`;
        const error = errors[f.name];
        const common = {
          id,
          name: f.name,
          autoComplete: f.autoComplete,
          value: values[f.name],
          maxLength: LIMITS[f.name],
          'aria-invalid': Boolean(error),
          'aria-describedby': error ? errorId : undefined,
          onChange: (ev: { target: { value: string } }) => {
            setValues((v) => ({ ...v, [f.name]: ev.target.value }));
            if (errors[f.name]) setErrors((er) => ({ ...er, [f.name]: undefined }));
          },
          className: `w-full border bg-cyanotype px-3 py-2.5 text-body text-blueprint placeholder:text-faded/70 ${
            error ? 'border-2 border-redline' : 'border-faded/70 focus:border-blueprint'
          }`,
        };
        return (
          <div key={f.name}>
            <label htmlFor={id} className="block text-small text-blueprint">
              {f.label}
            </label>
            <div className="mt-1.5">
              {f.type === 'textarea' ? <textarea rows={5} {...common} /> : <input type={f.type} {...common} />}
            </div>
            {error && (
              <p id={errorId} className="mt-1.5 text-small text-redline">
                {error}
              </p>
            )}
          </div>
        );
      })}

      {/* Honeypot: off-screen, out of the tab order, ignored by people. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={values.company}
            onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        <button type="submit" className="btn-primary" disabled={status.kind === 'sending'}>
          {status.kind === 'sending' ? 'Sending…' : 'Submit for approval'}
        </button>
        <p role="status" className="text-small text-faded">
          {status.kind === 'fallback' && (
            <>
              Couldn&rsquo;t send from here. Your email app will open with the message filled in.{' '}
              <a className="link text-blueprint" href={status.href}>
                Open it again
              </a>
            </>
          )}
        </p>
      </div>
    </form>
  );
}
