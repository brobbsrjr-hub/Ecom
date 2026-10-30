import 'server-only';
import twilio from 'twilio';

export function twilioConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

// Sends a text. Without Twilio credentials (local dev) it logs instead of sending.
export async function sendSms(from: string | null, to: string, body: string): Promise<void> {
  if (!twilioConfigured() || !from) {
    console.log(`[sms:dry-run] ${from ?? '(no number)'} -> ${to}: ${body}`);
    return;
  }
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  await client.messages.create({ from, to, body });
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits;
}

export function twiml(message?: string): Response {
  const body = message
    ? `<Response><Message>${escapeXml(message)}</Message></Response>`
    : '<Response/>';
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Verifies X-Twilio-Signature. Returns the parsed form params, or null if the request is not from Twilio.
export async function verifyTwilioRequest(request: Request, path: string): Promise<Record<string, string> | null> {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return null;
  const form = await request.formData();
  const params: Record<string, string> = {};
  form.forEach((value, key) => {
    params[key] = String(value);
  });
  const url = `${process.env.PUBLIC_BASE_URL}${path}`;
  const signature = request.headers.get('x-twilio-signature') ?? '';
  return twilio.validateRequest(token, signature, url, params) ? params : null;
}
