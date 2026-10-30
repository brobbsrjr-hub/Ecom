import { DateTime } from 'luxon';

export function formatDateTime(iso: string, timeZone: string): string {
  return DateTime.fromISO(iso, { zone: timeZone }).toFormat('ccc LLL d, h:mm a');
}

export function formatRelative(iso: string): string {
  return DateTime.fromISO(iso).toRelative() ?? '';
}

// +15125550142 -> (512) 555-0142 for US numbers; anything else unchanged.
export function formatPhone(phone: string): string {
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : phone;
}
