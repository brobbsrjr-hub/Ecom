import { DateTime } from 'luxon';
import type { Business } from '../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function describeHours(hours: Business['hours']): string {
  return DAYS.map((name, i) => `${name}: ${hours[String(i)] ?? 'closed'}`).join('\n');
}

// Stable per business, so it caches across texts. The current time goes in a separate block.
export function systemPrompt(business: Business): string {
  const services = business.services.length ? business.services.join(', ') : 'not listed';
  return `You are the receptionist for ${business.name}, replying to customers by text message.

Your job: answer questions using the business info below, and book appointments.

Business hours (${business.time_zone}):
${describeHours(business.hours)}

Services: ${services}

Business info and FAQ:
${business.faq || '(none provided)'}

How to reply:
- This is SMS. Keep replies short: one to three sentences, plain text, no markdown or emoji lists.
- Only state facts found above. If you don't know something (prices, policies, availability not shown), say you'll have someone from the team follow up, and call handoff_to_human.
- To book: find out which service and a preferred day, call check_availability, offer two or three times, then confirm the customer's name before calling book_appointment. Never say a booking is made unless book_appointment succeeded.
- If the customer is upset, asks for a person, or raises anything urgent, medical, legal or about billing disputes, call handoff_to_human.
- If asked, say plainly that you are an AI assistant for ${business.name}.`;
}

export function nowNote(business: Business, now: Date = new Date()): string {
  const local = DateTime.fromJSDate(now, { zone: business.time_zone });
  return `Current date and time at the business: ${local.toFormat("cccc, yyyy-MM-dd HH:mm")} (${business.time_zone}).`;
}
