import Anthropic from '@anthropic-ai/sdk';
import type { Business } from '../types';
import { nowNote, systemPrompt } from './prompt';
import { executeTool, TOOLS, type AgentDeps, type ToolEvent } from './tools';

export const FALLBACK_REPLY =
  "Thanks for your message! Someone from our team will get back to you shortly.";

const MAX_TURNS = 6;
const MAX_HISTORY = 40;

export interface AgentInput {
  client: Pick<Anthropic, 'messages'>;
  model: string;
  business: Business;
  history: Anthropic.MessageParam[];
  userText: string;
  deps: AgentDeps;
}

export interface AgentResult {
  reply: string;
  history: Anthropic.MessageParam[];
  events: ToolEvent[];
}

// One customer text in, one reply out. Runs the tool loop until Claude answers in text.
// SMS runs on Haiku, which has no server-side refusal fallback, so a refusal hands off to a human.
export async function runAgent(input: AgentInput): Promise<AgentResult> {
  const { client, model, business, deps } = input;
  const messages: Anthropic.MessageParam[] = [
    ...input.history,
    { role: 'user', content: input.userText },
  ];
  const events: ToolEvent[] = [];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await client.messages.create({
      model,
      max_tokens: 16000,
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: systemPrompt(business), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: nowNote(business, deps.now?.()) },
      ],
      tools: TOOLS,
      messages,
    });

    if (response.stop_reason === 'refusal') {
      await deps.handoff('AI declined to answer this message; please reply personally.');
      events.push({ type: 'handoff', reason: 'refusal' });
      return { reply: FALLBACK_REPLY, history: trimHistory(messages), events };
    }

    messages.push({ role: 'assistant', content: response.content });

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      return { reply: text || FALLBACK_REPLY, history: trimHistory(messages), events };
    }

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const use of toolUses) {
      const outcome = await executeTool(use.name, use.input, business, deps);
      if (outcome.event) events.push(outcome.event);
      results.push({
        type: 'tool_result',
        tool_use_id: use.id,
        content: outcome.content,
        is_error: outcome.isError,
      });
    }
    messages.push({ role: 'user', content: results });
  }

  await deps.handoff('AI could not finish this conversation; please reply personally.');
  events.push({ type: 'handoff', reason: 'max turns' });
  return { reply: FALLBACK_REPLY, history: trimHistory(messages), events };
}

// Keep recent turns. Always start on a plain-text user message so tool_use/tool_result pairs stay intact.
export function trimHistory(messages: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
  if (messages.length <= MAX_HISTORY) return messages;
  let start = messages.length - MAX_HISTORY;
  while (start < messages.length) {
    const m = messages[start];
    if (m.role === 'user' && typeof m.content === 'string') break;
    start++;
  }
  return messages.slice(start);
}
