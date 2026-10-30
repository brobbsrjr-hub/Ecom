import { requireProfile, userClient } from '@/lib/supabase/server';
import type { Message } from '@/lib/types';
import { TestChat } from './TestChat';

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const db = await userClient();
  const { data: conv } = await db
    .from('conversations')
    .select('id')
    .eq('business_id', id)
    .eq('channel', 'test')
    .eq('contact_phone', `test:${profile.id}`)
    .maybeSingle();

  let initial: Pick<Message, 'id' | 'sender' | 'body'>[] = [];
  if (conv) {
    const { data } = await db
      .from('messages')
      .select('id, sender, body')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
    initial = data ?? [];
  }

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Test chat</h1>
      <TestChat businessId={id} initial={initial} />
    </>
  );
}
