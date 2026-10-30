import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import { FALLBACK_REPLY, runAgent, trimHistory } from '@/lib/agent/run';
import type { AgentDeps } from '@/lib/agent/tools';
import type { Business } from '@/lib/types';

const business: Business = {
  id: 'biz1',
  name: 'Glow Spa',
  twilio_number: '+15550000000',
  forward_to: null,
  owner_phone: '+15551111111',
  time_zone: 'America/New_York',
  hours: { '1': '09:00-11:00' },
  services: ['Facial'],
  faq: 'Facials are $90.',
  slot_minutes: 30,
  missed_call_text: null,
  brand_color: '#2563eb',
  logo_url: null,
  ai_enabled: true,
  created_at: '2026-01-01T00:00:00Z',
};

function message(content: Anthropic.ContentBlock[], stop_reason: Anthropic.StopReason): Anthropic.Message {
  return { id: 'msg', type: 'message', role: 'assistant', model: 'test', content, stop_reason, stop_sequence: null, usage: {} as Anthropic.Usage } as Anthropic.Message;
}
const text = (t: string) => ({ type: 'text', text: t, citations: null }) as Anthropic.TextBlock;
const toolUse = (id: string, name: string, input: unknown) => ({ type: 'tool_use', id, name, input }) as Anthropic.ToolUseBlock;

// Snapshots each request because runAgent keeps appending to the same messages array.
function fakeClient(responses: Anthropic.Message[]) {
  const requests: Anthropic.MessageCreateParams[] = [];
  const create = vi.fn(async (params: Anthropic.MessageCreateParams) => {
    requests.push(structuredClone(params));
    return responses.shift()!;
  });
  return { client: { messages: { create } } as unknown as Pick<Anthropic, 'messages'>, requests };
}

function lastToolResult(request: Anthropic.MessageCreateParams): Anthropic.ToolResultBlockParam {
  return (request.messages.at(-1)!.content as Anthropic.ToolResultBlockParam[])[0];
}

function fakeDeps(): AgentDeps & { bookings: unknown[]; handoffs: string[] } {
  const bookings: unknown[] = [];
  const handoffs: string[] = [];
  return {
    bookings,
    handoffs,
    now: () => new Date('2026-11-01T12:00:00Z'),
    listBusy: async () => [],
    createBooking: async (b) => {
      bookings.push(b);
      return { id: 'bk1', starts_at: b.startsAt };
    },
    handoff: async (reason) => {
      handoffs.push(reason);
    },
  };
}

describe('runAgent', () => {
  it('returns a plain text reply', async () => {
    const { client } = fakeClient([message([text('We open at 9.')], 'end_turn')]);
    const res = await runAgent({ client, model: 'm', business, history: [], userText: 'When do you open?', deps: fakeDeps() });
    expect(res.reply).toBe('We open at 9.');
    expect(res.history).toHaveLength(2);
  });

  it('checks availability then books a valid slot', async () => {
    const deps = fakeDeps();
    const { client, requests } = fakeClient([
      message([toolUse('t1', 'check_availability', { date: '2026-11-02' })], 'tool_use'),
      message([toolUse('t2', 'book_appointment', { start: '2026-11-02T09:30:00-05:00', customer_name: 'Ana', service: 'Facial', notes: '' })], 'tool_use'),
      message([text("You're booked for Monday 9:30am, Ana!")], 'end_turn'),
    ]);
    const res = await runAgent({ client, model: 'm', business, history: [], userText: 'Book Monday morning, I am Ana', deps });

    expect(res.reply).toContain('booked');
    expect(deps.bookings).toEqual([
      expect.objectContaining({ contactName: 'Ana', startsAt: '2026-11-02T14:30:00.000Z', endsAt: '2026-11-02T15:00:00.000Z' }),
    ]);
    expect(res.events).toEqual([{ type: 'booked', bookingId: 'bk1', startsAt: '2026-11-02T14:30:00.000Z' }]);

    expect(lastToolResult(requests[1]).content).toContain('2026-11-02T09:30:00-05:00');
  });

  it('rejects bookings outside open slots without creating them', async () => {
    const deps = fakeDeps();
    const { client, requests } = fakeClient([
      message([toolUse('t1', 'book_appointment', { start: '2026-11-02T15:00:00-05:00', customer_name: 'Ana', service: '', notes: '' })], 'tool_use'),
      message([text('Sorry, that time is not available.')], 'end_turn'),
    ]);
    await runAgent({ client, model: 'm', business, history: [], userText: 'Book 3pm', deps });
    expect(deps.bookings).toHaveLength(0);
    expect(lastToolResult(requests[1]).is_error).toBe(true);
  });

  it('hands off to a human on refusal', async () => {
    const deps = fakeDeps();
    const { client } = fakeClient([message([], 'refusal')]);
    const res = await runAgent({ client, model: 'm', business, history: [], userText: '…', deps });
    expect(res.reply).toBe(FALLBACK_REPLY);
    expect(deps.handoffs).toHaveLength(1);
  });
});

describe('trimHistory', () => {
  it('keeps history starting at a plain user message', () => {
    const msgs: Anthropic.MessageParam[] = [];
    for (let i = 0; i < 30; i++) {
      msgs.push({ role: 'user', content: `q${i}` });
      msgs.push({ role: 'assistant', content: `a${i}` });
    }
    const trimmed = trimHistory(msgs);
    expect(trimmed.length).toBeLessThanOrEqual(40);
    expect(trimmed[0]).toEqual({ role: 'user', content: 'q10' });
  });
});
