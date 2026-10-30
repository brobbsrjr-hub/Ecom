import { describe, expect, it } from 'vitest';
import { dayBounds, openSlots } from '@/lib/agent/slots';

const hours = { '1': '09:00-11:00', '6': null };
const now = new Date('2026-11-01T12:00:00Z'); // a Sunday, well before the test day

describe('openSlots', () => {
  it('lists slots inside business hours in the business time zone', () => {
    const slots = openSlots({ date: '2026-11-02', timeZone: 'America/New_York', hours, slotMinutes: 30, busy: [], now });
    expect(slots).toEqual([
      '2026-11-02T09:00:00-05:00',
      '2026-11-02T09:30:00-05:00',
      '2026-11-02T10:00:00-05:00',
      '2026-11-02T10:30:00-05:00',
    ]);
  });

  it('returns nothing on closed days', () => {
    expect(openSlots({ date: '2026-11-07', timeZone: 'America/New_York', hours, slotMinutes: 30, busy: [], now })).toEqual([]);
  });

  it('removes slots that overlap existing bookings', () => {
    const busy = [{ starts_at: '2026-11-02T14:15:00Z', ends_at: '2026-11-02T14:45:00Z' }]; // 09:15-09:45 local
    const slots = openSlots({ date: '2026-11-02', timeZone: 'America/New_York', hours, slotMinutes: 30, busy, now });
    expect(slots).toEqual(['2026-11-02T10:00:00-05:00', '2026-11-02T10:30:00-05:00']);
  });

  it('skips slots inside the lead time', () => {
    const lateNow = new Date('2026-11-02T14:10:00Z'); // 09:10 local, 60 min lead
    const slots = openSlots({ date: '2026-11-02', timeZone: 'America/New_York', hours, slotMinutes: 30, busy: [], now: lateNow });
    expect(slots).toEqual(['2026-11-02T10:30:00-05:00']);
  });
});

describe('dayBounds', () => {
  it('converts a local day to UTC bounds', () => {
    expect(dayBounds('2026-11-02', 'America/New_York')).toEqual({
      start: '2026-11-02T05:00:00.000Z',
      end: '2026-11-03T05:00:00.000Z',
    });
  });
});
