# AI Receptionist

Text-message AI receptionist for local businesses, run by an agency.

- Answers customer texts from the business FAQ (Claude Haiku 5.5)
- Books appointments into a built-in calendar from business hours
- Missed call → rings the business line first, then texts the caller back so the AI can take over
- Hands off to a human (and texts the owner) when stuck, asked, or upset
- Agency admin: add clients, set them up, test the AI, invite the client
- Client portal (own branding, own data only): inbox, take over / reply, test chat, bookings, settings

Voice AI and the analytics dashboard come next.

## Stack

Next.js 16 (App Router, server actions) · Supabase (Postgres, Auth, row-level security) · Anthropic SDK · Twilio · Tailwind 4 · Vitest

## Setup

1. **Supabase**: create a project at supabase.com.
   - SQL editor → run `supabase/migrations/0001_init.sql`.
   - Authentication → URL configuration: set Site URL to your app URL and add `<app-url>/auth/callback` and `<app-url>/login` to redirect URLs.
2. **Env**: `cp .env.example .env.local` and fill in the Supabase URL, anon key, service role key and `ANTHROPIC_API_KEY`.
3. **Run**: `npm install && npm run dev`.
4. **Make yourself admin**: in Supabase → Authentication → Users, add your email (or invite yourself), then in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   Sign in at `/login` with a magic link.
5. **Add a client** → you land in their test chat. Talk to the AI as a customer.

Without Twilio keys, outbound texts are logged to the console (`[sms:dry-run]`) and Twilio webhooks return 403.

## Going live with a client (Twilio)

1. Buy a local number in Twilio. Register for A2P 10DLC (US business texting) before sending; approval takes days to weeks.
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `PUBLIC_BASE_URL` (your deployed https URL, exactly as Twilio calls it, used to verify webhook signatures).
3. On the number in Twilio:
   - Messaging → "A message comes in" → `POST {PUBLIC_BASE_URL}/api/twilio/sms`
   - Voice → "A call comes in" → `POST {PUBLIC_BASE_URL}/api/twilio/voice`
4. In the client's Settings, set the AI phone number, the business line to forward calls to, and the owner's cell.
5. Settings → "Give the client access" sends them an invite.

## Commands

| | |
|---|---|
| `npm run dev` | local dev server |
| `npm test` | unit tests (slots, agent loop, form parsing) |
| `npm run typecheck` | TypeScript |
| `npm run build` | production build |

## Layout

```
src/lib/agent/      prompt, tools (availability, booking, handoff), tool loop
src/lib/            conversations (shared by SMS + test chat), Twilio helpers, Supabase clients
src/app/admin/      agency: client list, add client
src/app/b/[id]/     client portal: inbox, thread, test chat, bookings, settings
src/app/api/twilio/ sms, voice (forward), dial-status (missed-call text-back)
supabase/migrations schema + row-level security
```

## Notes

- Model per channel: `MODEL_SMS` (default `claude-haiku-5-5`). `MODEL_VOICE` is reserved for the voice agent.
- Customers who text STOP are handled by Twilio's built-in opt-out.
- The AI says it's an AI if asked. Check your state's rules on AI disclosure and keep it on for calls.
- SMS threads keep the last 40 Claude messages and are stored in `conversations.history`.
