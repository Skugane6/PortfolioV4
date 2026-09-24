/**
 * The contact form's rules, shared by the page (inline errors before sending)
 * and the serverless route (api/contact.ts), so the two can never disagree.
 */
export interface ContactInput {
  name: string;
  email: string;
  message: string;
  /** Honeypot: hidden from people, filled in by naive bots. Must be empty. */
  company?: string;
}

export type ContactField = 'name' | 'email' | 'message';
export type ContactErrors = Partial<Record<ContactField, string>>;

export const LIMITS = { name: 100, email: 254, message: 4000 } as const;

// Deliberately loose: one @, something on each side, a dot in the domain.
// The mail server is the real check; this only catches obvious typos.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  if (!name) errors.name = 'Enter your name.';
  else if (name.length > LIMITS.name) errors.name = `Keep your name under ${LIMITS.name} characters.`;
  if (!email) errors.email = 'Enter your email address so I can reply.';
  else if (email.length > LIMITS.email || !EMAIL.test(email)) errors.email = 'Enter an email address like name@example.com.';
  if (!message) errors.message = 'Write a message.';
  else if (message.length > LIMITS.message) errors.message = `Keep the message under ${LIMITS.message} characters.`;
  return errors;
}

export function isSpam(input: ContactInput): boolean {
  return Boolean(input.company && input.company.trim());
}

/** A mailto: URL with the message filled in, for when the form can't send. */
export function mailtoFor(to: string, input: ContactInput): string {
  const subject = `Portfolio: message from ${input.name.trim() || 'a visitor'}`;
  const body = `${input.message.trim()}\n\n${input.name.trim()}\n${input.email.trim()}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
