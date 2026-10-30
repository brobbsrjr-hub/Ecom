import { describe, expect, it } from 'vitest';
import { parseBusinessForm } from '@/lib/businessForm';

function form(values: Record<string, string>): FormData {
  const f = new FormData();
  Object.entries(values).forEach(([k, v]) => f.set(k, v));
  return f;
}

const base = {
  name: 'Glow Spa',
  time_zone: 'America/New_York',
  services: 'Facial\n\nMassage\n',
  faq: 'Info',
  slot_minutes: '45',
  brand_color: '#112233',
  owner_phone: '(555) 123-4567',
  twilio_number: '+15550000000',
  forward_to: '',
  hours_1_open: '09:00',
  hours_1_close: '17:00',
  ai_enabled: 'on',
};

describe('parseBusinessForm', () => {
  it('parses fields, phones and hours', () => {
    const res = parseBusinessForm(form(base), true);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.fields.services).toEqual(['Facial', 'Massage']);
    expect(res.fields.owner_phone).toBe('+15551234567');
    expect(res.fields.forward_to).toBeNull();
    expect(res.fields.hours?.['1']).toBe('09:00-17:00');
    expect(res.fields.hours?.['0']).toBeNull();
    expect(res.fields.slot_minutes).toBe(45);
  });

  it('drops phone routing fields for clients', () => {
    const res = parseBusinessForm(form(base), false);
    expect(res.ok && 'twilio_number' in res.fields).toBe(false);
  });

  it('rejects close before open', () => {
    const res = parseBusinessForm(form({ ...base, hours_1_open: '17:00', hours_1_close: '09:00' }), true);
    expect(res.ok).toBe(false);
  });

  it('rejects bad phone numbers', () => {
    const res = parseBusinessForm(form({ ...base, owner_phone: '12' }), true);
    expect(res).toEqual({ ok: false, error: 'Phone numbers must be in +15551234567 format' });
  });
});
