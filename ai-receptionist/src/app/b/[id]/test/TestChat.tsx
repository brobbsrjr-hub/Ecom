'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MessageList } from '@/components/MessageList';
import type { Message } from '@/lib/types';
import { resetTestChat, sendTestMessage } from '../actions';

type ChatMessage = Pick<Message, 'id' | 'sender' | 'body'>;

export function TestChat({ businessId, initial }: { businessId: string; initial: ChatMessage[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    setError('');
    setMessages((m) => [...m, { id: crypto.randomUUID(), sender: 'contact', body }]);
    startTransition(async () => {
      const res = await sendTestMessage(businessId, body);
      if (res.error) setError(res.error);
      else if (res.reply) setMessages((m) => [...m, { id: crypto.randomUUID(), sender: 'ai', body: res.reply! }]);
      else setMessages((m) => [...m, { id: crypto.randomUUID(), sender: 'system', body: 'AI is paused (handed to a human). Reset to start over.' }]);
    });
  }

  function reset() {
    startTransition(async () => {
      await resetTestChat(businessId);
      setMessages([]);
      setError('');
      router.refresh();
    });
  }

  return (
    <div className="card flex h-[70vh] flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <span className="text-sm text-slate-600">You are the customer. Bookings made here are marked as tests.</span>
        <button onClick={reset} className="btn-ghost" disabled={pending}>Reset</button>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-500">Try: &quot;Hi, are you open Saturday?&quot; or &quot;Can I book for tomorrow afternoon?&quot;</p>
        )}
        <MessageList messages={messages} />
        {pending && <p className="mt-3 text-sm text-slate-500">AI is typing…</p>}
        <div ref={bottom} />
      </div>
      {error && <p className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input"
          placeholder="Text the AI…"
          disabled={pending}
        />
        <button className="btn" disabled={pending || !text.trim()}>Send</button>
      </form>
    </div>
  );
}
