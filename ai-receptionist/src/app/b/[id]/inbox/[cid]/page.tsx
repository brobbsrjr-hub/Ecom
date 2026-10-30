import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutoRefresh } from '@/components/AutoRefresh';
import { MessageList } from '@/components/MessageList';
import { SubmitButton } from '@/components/SubmitButton';
import { businessById } from '@/lib/businesses';
import { formatDateTime, formatPhone } from '@/lib/format';
import { userClient } from '@/lib/supabase/server';
import type { Conversation, Message } from '@/lib/types';
import { replyAsHuman, setAiPaused } from '../../actions';

export default async function Thread({ params }: { params: Promise<{ id: string; cid: string }> }) {
  const { id, cid } = await params;
  const db = await userClient();
  const business = await businessById(db, id);
  const { data: conv } = await db.from('conversations').select('*').eq('id', cid).eq('business_id', id).single();
  if (!business || !conv) notFound();
  const conversation = conv as Conversation;

  const { data } = await db
    .from('messages')
    .select('*')
    .eq('conversation_id', cid)
    .order('created_at', { ascending: true })
    .limit(500);
  const messages = (data ?? []) as Message[];

  const togglePause = setAiPaused.bind(null, id, cid, !conversation.ai_paused);
  const reply = replyAsHuman.bind(null, id, cid);

  return (
    <>
      <AutoRefresh />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/b/${id}/inbox`} className="text-sm text-slate-500 hover:text-slate-800">← Inbox</Link>
          <h1 className="text-xl font-semibold">{conversation.contact_name ?? formatPhone(conversation.contact_phone)}</h1>
          {conversation.contact_name && <p className="text-sm text-slate-500">{formatPhone(conversation.contact_phone)}</p>}
        </div>
        <form action={togglePause}>
          <SubmitButton className={conversation.ai_paused ? 'btn' : 'btn-ghost'}>
            {conversation.ai_paused ? 'Hand back to AI' : 'Take over'}
          </SubmitButton>
        </form>
      </div>

      {conversation.ai_paused && (
        <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          AI is paused on this conversation. Your replies go straight to the customer.
        </p>
      )}

      <div className="card mb-4 flex max-h-[60vh] flex-col-reverse overflow-y-auto bg-slate-50 p-4">
        <MessageList messages={messages} timeLabel={(m) => formatDateTime(m.created_at, business.time_zone)} />
      </div>

      <form action={reply} className="flex gap-2">
        <input name="body" className="input" placeholder="Reply as staff…" autoComplete="off" required />
        <SubmitButton>Send</SubmitButton>
      </form>
    </>
  );
}
