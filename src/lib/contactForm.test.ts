import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../api/contact';
import { mailtoFor, validateContact } from './contactForm';

const valid = { name: 'Ada', email: 'ada@example.com', message: 'Hello' };
const post = (body: unknown) =>
  POST(new Request('http://x/api/contact', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }));

describe('validateContact', () => {
  it('accepts a complete message', () => {
    expect(validateContact(valid)).toEqual({});
  });

  it('names each missing or malformed field', () => {
    expect(validateContact({ name: ' ', email: 'nope', message: '' })).toEqual({
      name: 'Enter your name.',
      email: 'Enter an email address like name@example.com.',
      message: 'Write a message.',
    });
  });

  it('limits message length', () => {
    expect(validateContact({ ...valid, message: 'x'.repeat(4001) }).message).toMatch(/under 4000/);
  });
});

describe('mailtoFor', () => {
  it('prefills subject and body, encoded', () => {
    const url = mailtoFor('me@example.com', { name: 'Ada L', email: 'ada@example.com', message: 'Hi & bye' });
    expect(url).toContain('mailto:me@example.com?subject=Portfolio%3A%20message%20from%20Ada%20L');
    expect(decodeURIComponent(url.split('body=')[1])).toBe('Hi & bye\n\nAda L\nada@example.com');
  });
});

describe('POST /api/contact', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('answers 501 when Resend is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('CONTACT_TO', '');
    const res = await post(valid);
    expect(res.status).toBe(501);
    expect(await res.json()).toEqual({ ok: false, reason: 'not-configured' });
  });

  it('rejects invalid input with the field errors', async () => {
    const res = await post({ ...valid, email: 'nope' });
    expect(res.status).toBe(400);
    expect((await res.json()).errors.email).toBeTruthy();
  });

  it('rejects a body that is not JSON', async () => {
    expect((await post('not json')).status).toBe(400);
  });

  it('silently drops honeypot submissions', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await post({ ...valid, company: 'Spam Inc' });
    expect(res.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends through Resend with reply-to set to the visitor', async () => {
    vi.stubEnv('RESEND_API_KEY', 'k');
    vi.stubEnv('CONTACT_TO', 'me@example.com');
    const fetchSpy = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    const res = await post(valid);
    expect(res.status).toBe(200);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(JSON.parse(init.body)).toMatchObject({ to: ['me@example.com'], reply_to: 'ada@example.com' });
  });

  it('reports a failed send as 502', async () => {
    vi.stubEnv('RESEND_API_KEY', 'k');
    vi.stubEnv('CONTACT_TO', 'me@example.com');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 422 })));
    expect((await post(valid)).status).toBe(502);
  });
});
