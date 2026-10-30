// Cal.com API v2 client. Each sub-account maps to one Cal.com event type.
// Docs: https://cal.com/docs/api-reference/v2

export interface Slot {
  start: string; // ISO timestamp
}

export interface BookingRequest {
  eventTypeId: number;
  start: string;
  name: string;
  email: string;
  phone: string;
  timeZone: string;
  notes?: string;
}

export interface BookingResult {
  id: string;
  start: string;
}

export interface CalendarProvider {
  getSlots(eventTypeId: number, startDate: string, endDate: string, timeZone: string): Promise<Slot[]>;
  book(request: BookingRequest): Promise<BookingResult>;
}

type Fetch = typeof fetch;

export function createCalcomProvider(apiKey: string, fetchImpl: Fetch = fetch): CalendarProvider {
  const base = 'https://api.cal.com/v2';

  async function call<T>(path: string, init: RequestInit, apiVersion: string): Promise<T> {
    const res = await fetchImpl(`${base}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'cal-api-version': apiVersion,
        'Content-Type': 'application/json',
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Cal.com ${path} failed (${res.status}): ${JSON.stringify(body)}`);
    }
    return body as T;
  }

  return {
    async getSlots(eventTypeId, startDate, endDate, timeZone) {
      const qs = new URLSearchParams({
        eventTypeId: String(eventTypeId),
        start: startDate,
        end: endDate,
        timeZone,
      });
      const body = await call<{ data: Record<string, { start: string }[]> }>(
        `/slots?${qs}`, { method: 'GET' }, '2024-09-04',
      );
      return Object.values(body.data ?? {}).flat();
    },

    async book(request) {
      const body = await call<{ data: { uid: string; start: string } }>(
        '/bookings',
        {
          method: 'POST',
          body: JSON.stringify({
            start: request.start,
            eventTypeId: request.eventTypeId,
            attendee: {
              name: request.name,
              email: request.email,
              phoneNumber: request.phone,
              timeZone: request.timeZone,
            },
            bookingFieldsResponses: request.notes ? { notes: request.notes } : undefined,
          }),
        },
        '2024-08-13',
      );
      return { id: body.data.uid, start: body.data.start };
    },
  };
}
