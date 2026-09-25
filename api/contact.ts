import { isSpam, singleLine, validateContact, type ContactInput } from '../src/lib/contactForm';

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
 *
 * Abuse: only JSON is accepted, so another site can't post here from a
 * visitor's browser without a CORS preflight (which this route never
 * grants), and a browser Origin from another host is refused. Per-IP rate
 * limiting belongs in a Vercel firewall rule (NEEDS-FROM-SEARAN.md).
 */
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function POST(request: Request): Promise<Response> {
  if (!/^application\/json\b/i.test(request.headers.get('content-type') ?? '')) {
    return json(415, { ok: false, reason: 'unsupported-media-type' });
  }
  const origin = request.headers.get('origin');
  if (origin && !sameHost(origin, request.url)) return json(403, { ok: false, reason: 'cross-origin' });

  let input: ContactInput;
  try {
    const raw = (await request.json()) as Partial<ContactInput>;
    input = {
      name: String(raw.name ?? ''),
      email: String(raw.email ?? ''),
      message: String(raw.message ?? ''),
      honeypot: String(raw.honeypot ?? ''),
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

  const name = singleLine(input.name);
  const email = singleLine(input.email);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM ?? 'Portfolio <onboarding@resend.dev>',
        to: [to],
        reply_to: email,
        subject: `Portfolio: message from ${name}`,
        text: `${input.message.trim()}\n\n${name} <${email}>`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return json(502, { ok: false, reason: 'send-failed' });
  } catch {
    // Network failure or timeout: the page falls back to mailto.
    return json(502, { ok: false, reason: 'send-failed' });
  }
  return json(200, { ok: true });
}

function sameHost(origin: string, url: string): boolean {
  try {
    return new URL(origin).host === new URL(url).host;
  } catch {
    return false;
  }
}
