import { businessByNumber } from '@/lib/businesses';
import { handleContactMessage } from '@/lib/conversations';
import { normalizePhone, twiml, verifyTwilioRequest } from '@/lib/sms';
import { serviceClient } from '@/lib/supabase/server';

// Twilio "A message comes in" webhook for each client number.
export async function POST(request: Request) {
  const params = await verifyTwilioRequest(request, '/api/twilio/sms');
  if (!params) return new Response('Forbidden', { status: 403 });

  const db = serviceClient();
  const business = await businessByNumber(db, params.To);
  if (!business) return twiml();

  const body = (params.Body ?? '').trim();
  if (!body) return twiml();

  try {
    const { reply } = await handleContactMessage(db, business, 'sms', normalizePhone(params.From), body);
    return twiml(reply ?? undefined);
  } catch (err) {
    console.error('[twilio/sms]', err);
    return twiml();
  }
}
