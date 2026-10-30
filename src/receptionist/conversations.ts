import Anthropic from '@anthropic-ai/sdk';

// In-memory SMS thread store. Swap for Redis/Postgres before running more than one instance.

export interface ConversationStore {
  get(clientId: string, contactPhone: string): Anthropic.MessageParam[];
  save(clientId: string, contactPhone: string, messages: Anthropic.MessageParam[]): void;
}

const MAX_MESSAGES = 40;
const TTL_MS = 24 * 60 * 60 * 1000;

export function createMemoryConversationStore(now: () => number = Date.now): ConversationStore {
  const threads = new Map<string, { messages: Anthropic.MessageParam[]; updatedAt: number }>();
  const key = (clientId: string, phone: string) => `${clientId}:${phone}`;

  return {
    get(clientId, contactPhone) {
      const thread = threads.get(key(clientId, contactPhone));
      if (!thread || now() - thread.updatedAt > TTL_MS) return [];
      return [...thread.messages];
    },
    save(clientId, contactPhone, messages) {
      threads.set(key(clientId, contactPhone), {
        messages: trimHistory(messages),
        updatedAt: now(),
      });
    },
  };
}

// Drop oldest turns but always start on a plain user text message so tool_use/tool_result pairs stay intact.
export function trimHistory(messages: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
  if (messages.length <= MAX_MESSAGES) return messages;
  let start = messages.length - MAX_MESSAGES;
  while (start < messages.length) {
    const m = messages[start];
    if (m.role === 'user' && typeof m.content === 'string') break;
    start++;
  }
  return messages.slice(start);
}
