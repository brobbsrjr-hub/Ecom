import { DateTime } from 'luxon';

export function formatDateTime(iso: string, timeZone: string): string {
  return DateTime.fromISO(iso, { zone: timeZone }).toFormat('ccc LLL d, h:mm a');
}

export function formatRelative(iso: string): string {
  return DateTime.fromISO(iso).toRelative() ?? '';
}
