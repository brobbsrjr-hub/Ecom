import { DateTime } from 'luxon';

export interface BusyRange {
  starts_at: string;
  ends_at: string;
}

export interface SlotOptions {
  date: string; // YYYY-MM-DD in the business time zone
  timeZone: string;
  hours: Record<string, string | null>;
  slotMinutes: number;
  busy: BusyRange[];
  now?: Date;
  // Minimum lead time before the first bookable slot
  leadMinutes?: number;
}

const HOURS_RE = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/;

// Open appointment start times for one day, as ISO strings with the business offset.
export function openSlots(opts: SlotOptions): string[] {
  const day = DateTime.fromISO(opts.date, { zone: opts.timeZone });
  if (!day.isValid) throw new Error(`Invalid date: ${opts.date}`);

  const openHours = opts.hours[String(day.weekday % 7)];
  if (!openHours) return [];
  const match = openHours.match(HOURS_RE);
  if (!match) throw new Error(`Invalid hours format: ${openHours}`);

  const open = day.set({ hour: +match[1], minute: +match[2], second: 0, millisecond: 0 });
  const close = day.set({ hour: +match[3], minute: +match[4], second: 0, millisecond: 0 });
  const earliest = DateTime.fromJSDate(opts.now ?? new Date()).plus({ minutes: opts.leadMinutes ?? 60 });

  const busy = opts.busy.map((b) => ({
    start: DateTime.fromISO(b.starts_at).toMillis(),
    end: DateTime.fromISO(b.ends_at).toMillis(),
  }));

  const slots: string[] = [];
  for (
    let start = open;
    start.plus({ minutes: opts.slotMinutes }) <= close;
    start = start.plus({ minutes: opts.slotMinutes })
  ) {
    if (start < earliest) continue;
    const s = start.toMillis();
    const e = start.plus({ minutes: opts.slotMinutes }).toMillis();
    if (busy.some((b) => s < b.end && e > b.start)) continue;
    slots.push(start.toISO({ suppressMilliseconds: true })!);
  }
  return slots;
}

export function isValidHours(value: string): boolean {
  return HOURS_RE.test(value);
}

export function dayBounds(date: string, timeZone: string): { start: string; end: string } {
  const day = DateTime.fromISO(date, { zone: timeZone }).startOf('day');
  return { start: day.toUTC().toISO()!, end: day.plus({ days: 1 }).toUTC().toISO()! };
}
