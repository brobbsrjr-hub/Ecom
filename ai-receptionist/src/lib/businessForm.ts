import { z } from 'zod';
import { isValidHours } from './agent/slots';

const PHONE_RE = /^\+[1-9]\d{7,14}$/;

const optionalPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s().-]/g, ''))
  .transform((v) => (v && !v.startsWith('+') && v.length === 10 ? `+1${v}` : v))
  .refine((v) => v === '' || PHONE_RE.test(v), 'Phone numbers must be in +15551234567 format')
  .transform((v) => v || null);

const Schema = z.object({
  name: z.string().trim().min(1, 'Business name is required'),
  time_zone: z.string().trim().refine(isTimeZone, 'Unknown time zone'),
  services: z.string().transform((v) => v.split('\n').map((s) => s.trim()).filter(Boolean)),
  faq: z.string().trim(),
  slot_minutes: z.coerce.number().int().min(5).max(480),
  missed_call_text: z.string().trim().transform((v) => v || null),
  brand_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Brand color must be like #2563eb'),
  logo_url: z
    .string()
    .trim()
    .refine((v) => v === '' || v.startsWith('https://'), 'Logo URL must start with https://')
    .transform((v) => v || null),
  owner_phone: optionalPhone,
  forward_to: optionalPhone,
  twilio_number: optionalPhone,
  ai_enabled: z.boolean(),
});

export type BusinessFields = z.infer<typeof Schema> & { hours: Record<string, string | null> };

function isTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export type ParseResult = { ok: true; fields: Partial<BusinessFields> } | { ok: false; error: string };

// Clients may edit their own business but not the phone routing, which the agency controls.
export function parseBusinessForm(form: FormData, isAdmin: boolean): ParseResult {
  const get = (k: string) => String(form.get(k) ?? '');
  const parsed = Schema.safeParse({
    name: get('name'),
    time_zone: get('time_zone'),
    services: get('services'),
    faq: get('faq'),
    slot_minutes: get('slot_minutes') || '30',
    missed_call_text: get('missed_call_text'),
    brand_color: get('brand_color') || '#2563eb',
    logo_url: get('logo_url'),
    owner_phone: get('owner_phone'),
    forward_to: get('forward_to'),
    twilio_number: get('twilio_number'),
    ai_enabled: form.get('ai_enabled') === 'on',
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const hours: Record<string, string | null> = {};
  for (let day = 0; day < 7; day++) {
    const open = get(`hours_${day}_open`);
    const close = get(`hours_${day}_close`);
    if (form.get(`hours_${day}_closed`) === 'on' || !open || !close) {
      hours[day] = null;
      continue;
    }
    const range = `${open}-${close}`;
    if (!isValidHours(range) || open >= close) {
      return { ok: false, error: `Invalid hours for day ${day}: ${range}` };
    }
    hours[day] = range;
  }

  const fields: Partial<BusinessFields> = { ...parsed.data, hours };
  if (!isAdmin) {
    delete fields.twilio_number;
    delete fields.forward_to;
  }
  return { ok: true, fields };
}
