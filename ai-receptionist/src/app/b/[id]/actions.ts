'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { businessById } from '@/lib/businesses';
import { parseBusinessForm } from '@/lib/businessForm';
import { getOrCreateConversation, handleContactMessage, sendHumanReply } from '@/lib/conversations';
import { requireAdmin, requireBusinessAccess, serviceClient, userClient } from '@/lib/supabase/server';
import type { Conversation } from '@/lib/types';

async function loadBusiness(businessId: string) {
  const profile = await requireBusinessAccess(businessId);
  const db = await userClient();
  const business = await businessById(db, businessId);
  if (!business) throw new Error('Business not found');
  return { profile, db, business };
}

export async function updateBusiness(businessId: string, form: FormData): Promise<void> {
  const { profile, db } = await loadBusiness(businessId);
  const parsed = parseBusinessForm(form, profile.role === 'admin');
  const base = `/b/${businessId}/settings`;
  if (!parsed.ok) redirect(`${base}?error=${encodeURIComponent(parsed.error)}`);
  const { error } = await db.from('businesses').update(parsed.fields).eq('id', businessId);
  if (error) redirect(`${base}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/b/${businessId}`, 'layout');
  redirect(`${base}?saved=1`);
}

async function loadConversation(businessId: string, conversationId: string) {
  const ctx = await loadBusiness(businessId);
  const { data } = await ctx.db
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('business_id', businessId)
    .single();
  if (!data) throw new Error('Conversation not found');
  return { ...ctx, conversation: data as Conversation };
}

export async function setAiPaused(businessId: string, conversationId: string, paused: boolean): Promise<void> {
  const { db } = await loadConversation(businessId, conversationId);
  await db.from('conversations').update({ ai_paused: paused }).eq('id', conversationId);
  revalidatePath(`/b/${businessId}/inbox/${conversationId}`);
}

export async function replyAsHuman(businessId: string, conversationId: string, form: FormData): Promise<void> {
  const text = String(form.get('body') ?? '').trim();
  if (!text) return;
  const { db, business, conversation } = await loadConversation(businessId, conversationId);
  // Replying by hand pauses the AI so it doesn't talk over the owner.
  if (!conversation.ai_paused) {
    await db.from('conversations').update({ ai_paused: true }).eq('id', conversationId);
  }
  await sendHumanReply(db, business, conversation, text);
  revalidatePath(`/b/${businessId}/inbox/${conversationId}`);
}

function testPhone(userId: string): string {
  return `test:${userId}`;
}

export async function sendTestMessage(businessId: string, text: string): Promise<{ reply: string | null; error?: string }> {
  const { profile, db, business } = await loadBusiness(businessId);
  const trimmed = text.trim();
  if (!trimmed) return { reply: null };
  try {
    // Test chat ignores the business-wide AI switch so you can try it before going live.
    const result = await handleContactMessage(db, { ...business, ai_enabled: true }, 'test', testPhone(profile.id), trimmed);
    return result;
  } catch (err) {
    console.error('[test-chat]', err);
    return { reply: null, error: (err as Error).message };
  }
}

export async function resetTestChat(businessId: string): Promise<void> {
  const { profile, db } = await loadBusiness(businessId);
  const conversation = await getOrCreateConversation(db, businessId, 'test', testPhone(profile.id));
  await db.from('bookings').delete().eq('conversation_id', conversation.id).eq('source', 'test');
  await db.from('conversations').delete().eq('id', conversation.id);
}

export async function cancelBooking(businessId: string, bookingId: string): Promise<void> {
  const { db } = await loadBusiness(businessId);
  await db.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId).eq('business_id', businessId);
  revalidatePath(`/b/${businessId}/bookings`);
}

export async function inviteClientUser(businessId: string, form: FormData): Promise<void> {
  await requireAdmin();
  const email = String(form.get('email') ?? '').trim();
  const base = `/b/${businessId}/settings`;
  if (!email) redirect(`${base}?error=${encodeURIComponent('Email is required')}`);
  const { error } = await serviceClient().auth.admin.inviteUserByEmail(email, {
    data: { business_id: businessId },
    redirectTo: `${process.env.PUBLIC_BASE_URL}/login`,
  });
  if (error) redirect(`${base}?error=${encodeURIComponent(error.message)}`);
  redirect(`${base}?invited=${encodeURIComponent(email)}`);
}
