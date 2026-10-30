import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { runAgent } from './agent/run';
import type { AgentDeps } from './agent/tools';
import { sendSms } from './sms';
import type { Business, Channel, Conversation } from './types';

let anthropic: Anthropic | null = null;
function claude(): Anthropic {
  anthropic ??= new Anthropic();
  return anthropic;
}

export async function getOrCreateConversation(
  db: SupabaseClient,
  businessId: string,
  channel: Channel,
  contactPhone: string,
): Promise<Conversation> {
  const { data, error } = await db
    .from('conversations')
    .upsert(
      { business_id: businessId, channel, contact_phone: contactPhone },
      { onConflict: 'business_id,channel,contact_phone', ignoreDuplicates: false },
    )
    .select()
    .single();
  if (error) throw new Error(`conversation upsert failed: ${error.message}`);
  return data as Conversation;
}

export async function logMessage(
  db: SupabaseClient,
  conversation: Conversation,
  direction: 'inbound' | 'outbound',
  sender: 'contact' | 'ai' | 'human' | 'system',
  body: string,
): Promise<void> {
  const { error } = await db.from('messages').insert({
    conversation_id: conversation.id,
    business_id: conversation.business_id,
    direction,
    sender,
    body,
  });
  if (error) throw new Error(`message insert failed: ${error.message}`);
  await db
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversation.id);
}

function agentDeps(db: SupabaseClient, business: Business, conversation: Conversation): AgentDeps {
  return {
    async listBusy(businessId, startIso, endIso) {
      const { data, error } = await db
        .from('bookings')
        .select('starts_at, ends_at')
        .eq('business_id', businessId)
        .eq('status', 'confirmed')
        .lt('starts_at', endIso)
        .gt('ends_at', startIso);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    async createBooking(b) {
      const { data, error } = await db
        .from('bookings')
        .insert({
          business_id: b.businessId,
          conversation_id: conversation.id,
          contact_name: b.contactName,
          contact_phone: conversation.channel === 'sms' ? conversation.contact_phone : null,
          service: b.service,
          notes: b.notes,
          starts_at: b.startsAt,
          ends_at: b.endsAt,
          source: conversation.channel,
        })
        .select('id, starts_at')
        .single();
      if (error) throw new Error(error.message);
      if (conversation.contact_name !== b.contactName) {
        await db.from('conversations').update({ contact_name: b.contactName }).eq('id', conversation.id);
      }
      return data;
    },
    async handoff(reason) {
      await db.from('conversations').update({ ai_paused: true }).eq('id', conversation.id);
      await logMessage(db, conversation, 'outbound', 'system', `Handed to a human: ${reason}`);
      if (conversation.channel === 'sms' && business.owner_phone) {
        await sendSms(
          business.twilio_number,
          business.owner_phone,
          `[${business.name}] Customer ${conversation.contact_phone} needs you: ${reason}`,
        );
      }
    },
  };
}

export interface ContactMessageResult {
  reply: string | null; // null when the AI is paused and a human should answer
}

// Shared by the Twilio SMS webhook and the in-app test chat.
export async function handleContactMessage(
  db: SupabaseClient,
  business: Business,
  channel: Channel,
  contactPhone: string,
  text: string,
): Promise<ContactMessageResult> {
  const conversation = await getOrCreateConversation(db, business.id, channel, contactPhone);
  await logMessage(db, conversation, 'inbound', 'contact', text);

  if (conversation.ai_paused || !business.ai_enabled) return { reply: null };

  const model = process.env.MODEL_SMS || 'claude-haiku-5-5';
  const result = await runAgent({
    client: claude(),
    model,
    business,
    history: conversation.history,
    userText: text,
    deps: agentDeps(db, business, conversation),
  });

  await db.from('conversations').update({ history: result.history }).eq('id', conversation.id);
  await logMessage(db, conversation, 'outbound', 'ai', result.reply);
  return { reply: result.reply };
}

// Owner/agency typed a reply in the inbox. Recorded in the AI history so it has context if resumed.
export async function sendHumanReply(
  db: SupabaseClient,
  business: Business,
  conversation: Conversation,
  text: string,
): Promise<void> {
  if (conversation.channel === 'sms') {
    await sendSms(business.twilio_number, conversation.contact_phone, text);
  }
  await logMessage(db, conversation, 'outbound', 'human', text);
  const history: Anthropic.MessageParam[] = [
    ...conversation.history,
    { role: 'assistant', content: `(Staff member replied) ${text}` },
  ];
  // History must start with a user turn; a staff-first thread has nothing for the AI to continue yet.
  if (history[0]?.role === 'user') {
    await db.from('conversations').update({ history }).eq('id', conversation.id);
  }
}
