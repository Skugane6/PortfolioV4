import { isSpam, validateContact, type ContactInput } from '../src/lib/contactForm';

/**
 * POST /api/contact: sends the approval form through Resend.
 *
 * Configure in Vercel project settings:
 *   RESEND_API_KEY  Resend API key
 *   CONTACT_TO      address that receives messages
 *   CONTACT_FROM    verified sender, e.g. "Portfolio <hello@yourdomain>"
 *                   (defaults to Resend's onboarding sender, which only
 *                   delivers to the Resend account owner)
 *
 * Unconfigured, it answers 501 and the page falls back to a prefilled
 * mailto: link, so the form is never a dead end.
 */
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function POST(request: Request): Promise<Response> {
  let input: ContactInput;
  try {
    const raw = (await request.json()) as Partial<ContactInput>;
    input = {
      name: String(raw.name ?? ''),
      email: String(raw.email ?? ''),
      message: String(raw.message ?? ''),
      company: String(raw.company ?? ''),
    };
  } catch {
    return json(400, { ok: false, reason: 'invalid-json' });
  }

  // Pretend success to bots so they don't retry; send nothing.
  if (isSpam(input)) return json(200, { ok: true });

  const errors = validateContact(input);
  if (Object.keys(errors).length > 0) return json(400, { ok: false, reason: 'invalid', errors });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  if (!key || !to) return json(501, { ok: false, reason: 'not-configured' });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM ?? 'Portfolio <onboarding@resend.dev>',
      to: [to],
      reply_to: input.email.trim(),
      subject: `Portfolio: message from ${input.name.trim()}`,
      text: `${input.message.trim()}\n\n${input.name.trim()} <${input.email.trim()}>`,
    }),
  });
  if (!res.ok) return json(502, { ok: false, reason: 'send-failed' });
  return json(200, { ok: true });
}
