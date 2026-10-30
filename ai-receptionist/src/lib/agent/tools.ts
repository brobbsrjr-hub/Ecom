import type Anthropic from '@anthropic-ai/sdk';
import { DateTime } from 'luxon';
import { z } from 'zod';
import type { Business } from '../types';
import { dayBounds, openSlots, type BusyRange } from './slots';

export interface NewBooking {
  businessId: string;
  contactName: string;
  service: string | null;
  notes: string | null;
  startsAt: string;
  endsAt: string;
}

// Side effects the agent can trigger. Implemented with Supabase in production, fakes in tests.
export interface AgentDeps {
  listBusy(businessId: string, startIso: string, endIso: string): Promise<BusyRange[]>;
  createBooking(booking: NewBooking): Promise<{ id: string; starts_at: string }>;
  handoff(reason: string): Promise<void>;
  now?: () => Date;
}

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'check_availability',
    description:
      'List open appointment start times for one day. Use before offering times to the customer.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Day to check, YYYY-MM-DD, in the business time zone.' },
      },
      required: ['date'],
      additionalProperties: false,
    },
  },
  {
    name: 'book_appointment',
    description:
      'Book an appointment at one of the start times returned by check_availability. Confirm the customer name first.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        start: { type: 'string', description: 'Exact ISO start time from check_availability.' },
        customer_name: { type: 'string' },
        service: { type: 'string', description: 'Service requested, or empty string if not given.' },
        notes: { type: 'string', description: 'Anything the business should know, or empty string.' },
      },
      required: ['start', 'customer_name', 'service', 'notes'],
      additionalProperties: false,
    },
  },
  {
    name: 'handoff_to_human',
    description:
      'Pause the AI on this conversation and alert the business owner to reply personally.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'One sentence the owner will read.' },
      },
      required: ['reason'],
      additionalProperties: false,
    },
  },
];

const CheckInput = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
const BookInput = z.object({
  start: z.string(),
  customer_name: z.string().min(1),
  service: z.string(),
  notes: z.string(),
});
const HandoffInput = z.object({ reason: z.string().min(1) });

export type ToolEvent =
  | { type: 'booked'; bookingId: string; startsAt: string }
  | { type: 'handoff'; reason: string };

export interface ToolOutcome {
  content: string;
  isError: boolean;
  event?: ToolEvent;
}

async function slotsFor(business: Business, date: string, deps: AgentDeps): Promise<string[]> {
  const { start, end } = dayBounds(date, business.time_zone);
  const busy = await deps.listBusy(business.id, start, end);
  return openSlots({
    date,
    timeZone: business.time_zone,
    hours: business.hours,
    slotMinutes: business.slot_minutes,
    busy,
    now: deps.now?.(),
  });
}

export async function executeTool(
  name: string,
  input: unknown,
  business: Business,
  deps: AgentDeps,
): Promise<ToolOutcome> {
  try {
    switch (name) {
      case 'check_availability': {
        const { date } = CheckInput.parse(input);
        const slots = await slotsFor(business, date, deps);
        return {
          content: JSON.stringify(slots.length ? { date, open_times: slots } : { date, open_times: [], note: 'No openings that day.' }),
          isError: false,
        };
      }
      case 'book_appointment': {
        const args = BookInput.parse(input);
        const start = DateTime.fromISO(args.start, { zone: business.time_zone });
        if (!start.isValid) return { content: 'Invalid start time.', isError: true };
        const date = start.toISODate()!;
        const open = await slotsFor(business, date, deps);
        const wanted = start.toMillis();
        if (!open.some((s) => DateTime.fromISO(s).toMillis() === wanted)) {
          return {
            content: `That time is not available. Open times on ${date}: ${open.join(', ') || 'none'}`,
            isError: true,
          };
        }
        const booking = await deps.createBooking({
          businessId: business.id,
          contactName: args.customer_name,
          service: args.service || null,
          notes: args.notes || null,
          startsAt: start.toUTC().toISO()!,
          endsAt: start.plus({ minutes: business.slot_minutes }).toUTC().toISO()!,
        });
        return {
          content: JSON.stringify({ booked: true, booking_id: booking.id, start: start.toISO() }),
          isError: false,
          event: { type: 'booked', bookingId: booking.id, startsAt: booking.starts_at },
        };
      }
      case 'handoff_to_human': {
        const { reason } = HandoffInput.parse(input);
        await deps.handoff(reason);
        return {
          content: 'Owner alerted. Tell the customer someone from the team will reply soon.',
          isError: false,
          event: { type: 'handoff', reason },
        };
      }
      default:
        return { content: `Unknown tool: ${name}`, isError: true };
    }
  } catch (err) {
    return { content: `Tool failed: ${(err as Error).message}`, isError: true };
  }
}
