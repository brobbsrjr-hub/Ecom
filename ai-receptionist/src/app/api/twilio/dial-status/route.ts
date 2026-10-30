import { businessByNumber } from '@/lib/businesses';
import { getOrCreateConversation, logMessage } from '@/lib/conversations';
import { normalizePhone, sendSms, verifyTwilioRequest } from '@/lib/sms';
import { serviceClient } from '@/lib/supabase/server';

const MISSED = new Set(['no-answer', 'busy', 'failed', 'canceled']);

function xml(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

// Runs after <Dial> ends. If nobody picked up, text the caller so the SMS agent can take over.
export async function POST(request: Request) {
  const params = await verifyTwilioRequest(request, '/api/twilio/dial-status');
  if (!params) return new Response('Forbidden', { status: 403 });

  const db = serviceClient();
  const business = await businessByNumber(db, params.To);
  if (!business) return xml('<Hangup/>');

  const status = params.DialCallStatus ?? 'unknown';
  const missed = MISSED.has(status);
  await db.from('calls').upsert(
    {
      business_id: business.id,
      external_id: params.CallSid,
      from_number: params.From,
      status: missed ? 'missed' : status,
    },
    { onConflict: 'external_id' },
  );

  if (!missed) return xml('<Hangup/>');

  const caller = normalizePhone(params.From);
  const text =
    business.missed_call_text ||
    `Hi, this is ${business.name}. Sorry we missed your call! How can we help? You can reply here to ask a question or book an appointment.`;
  try {
    await sendSms(business.twilio_number, caller, text);
    const conversation = await getOrCreateConversation(db, business.id, 'sms', caller);
    await logMessage(db, conversation, 'outbound', 'ai', text);
  } catch (err) {
    console.error('[twilio/dial-status]', err);
  }
  return xml('<Say>Sorry we missed you. We just sent you a text message.</Say><Hangup/>');
}
