import Link from 'next/link';
import { AutoRefresh } from '@/components/AutoRefresh';
import { formatRelative } from '@/lib/format';
import { userClient } from '@/lib/supabase/server';
import type { Conversation } from '@/lib/types';

export default async function Inbox({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await userClient();
  const { data } = await db
    .from('conversations')
    .select('id, contact_phone, contact_name, ai_paused, last_message_at')
    .eq('business_id', id)
    .eq('channel', 'sms')
    .order('last_message_at', { ascending: false })
    .limit(100);
  const conversations = (data ?? []) as Pick<Conversation, 'id' | 'contact_phone' | 'contact_name' | 'ai_paused' | 'last_message_at'>[];

  const ids = conversations.map((c) => c.id);
  const previews = new Map<string, string>();
  if (ids.length) {
    const { data: msgs } = await db
      .from('messages')
      .select('conversation_id, body, created_at')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false })
      .limit(500);
    for (const m of msgs ?? []) {
      if (!previews.has(m.conversation_id)) previews.set(m.conversation_id, m.body);
    }
  }

  return (
    <>
      <AutoRefresh />
      <h1 className="mb-4 text-xl font-semibold">Inbox</h1>
      {conversations.length === 0 ? (
        <p className="card p-6 text-sm text-slate-600">
          No conversations yet. Texts to your AI number and missed-call text-backs will appear here.
          Try the <Link href={`/b/${id}/test`} className="underline">test chat</Link> first.
        </p>
      ) : (
        <ul className="card divide-y divide-slate-200">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link href={`/b/${id}/inbox/${c.id}`} className="block px-4 py-3 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{c.contact_name ?? c.contact_phone}</span>
                  <span className="text-xs text-slate-500">{formatRelative(c.last_message_at)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {c.ai_paused && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">Needs you</span>
                  )}
                  <span className="truncate text-sm text-slate-600">{previews.get(c.id) ?? ''}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
