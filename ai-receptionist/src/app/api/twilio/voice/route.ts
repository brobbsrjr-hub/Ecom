import { businessByNumber } from '@/lib/businesses';
import { escapeXml, verifyTwilioRequest } from '@/lib/sms';
import { serviceClient } from '@/lib/supabase/server';

const RING_SECONDS = 20;

// Twilio "A call comes in" webhook: ring the real business line first.
export async function POST(request: Request) {
  const params = await verifyTwilioRequest(request, '/api/twilio/voice');
  if (!params) return new Response('Forbidden', { status: 403 });

  const business = await businessByNumber(serviceClient(), params.To);
  const xml = business?.forward_to
    ? `<Response><Dial timeout="${RING_SECONDS}" action="/api/twilio/dial-status">${escapeXml(business.forward_to)}</Dial></Response>`
    : '<Response><Say>Sorry, this number is not set up yet.</Say><Hangup/></Response>';
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>${xml}`, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
