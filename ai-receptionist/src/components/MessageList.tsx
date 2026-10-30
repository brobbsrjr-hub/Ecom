import type { Message } from '@/lib/types';

const LABEL: Record<Message['sender'], string> = {
  contact: 'Customer',
  ai: 'AI',
  human: 'Staff',
  system: '',
};

export function MessageList({ messages, timeLabel }: { messages: Pick<Message, 'id' | 'sender' | 'body'>[]; timeLabel?: (m: Message) => string }) {
  return (
    <ul className="space-y-3">
      {messages.map((m) => {
        if (m.sender === 'system') {
          return <li key={m.id} className="text-center text-xs text-slate-500">{m.body}</li>;
        }
        const mine = m.sender !== 'contact';
        return (
          <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%]">
              <div className={`mb-1 text-xs text-slate-500 ${mine ? 'text-right' : ''}`}>
                {LABEL[m.sender]}
                {timeLabel ? ` · ${timeLabel(m as Message)}` : ''}
              </div>
              <div
                className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  mine ? 'bg-[var(--brand)] text-white' : 'bg-white text-slate-900 ring-1 ring-slate-200'
                } ${m.sender === 'human' ? 'opacity-90' : ''}`}
              >
                {m.body}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
