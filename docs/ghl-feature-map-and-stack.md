# GoHighLevel Feature Map → Build Plan & Tech Stack

Goal: rebuild GHL's capabilities as an original, multi-tenant "agency OS" (own brand, own code).
Research date: 2026-10-30. Feature list built from public docs/reviews; module names and pricing differ between sources, so check against highlevel.com before committing scope.

---

## 0. Core architecture (everything else sits on this)

GHL = **3-level multi-tenant SaaS**: Agency → Sub-account (location) → Users. Every table carries `agency_id` + `location_id`. Agencies white-label it and resell it (SaaS mode).

| Layer | Pick | Why |
|---|---|---|
| Monorepo | Turborepo + pnpm, TypeScript end-to-end | Repo is already TS/Jest |
| Web app | Next.js 15 (App Router) + React 19 + Tailwind + shadcn/ui | Dashboard plus custom-domain rendering of funnels and sites |
| API | NestJS (or Fastify + tRPC) REST + GraphQL public API | Modules map to feature domains |
| DB | PostgreSQL 16 (Neon/RDS/Supabase) with row-level security on `location_id` | Tenant isolation |
| ORM | Drizzle or Prisma | |
| Cache / pub-sub | Redis (Upstash/ElastiCache) | Sessions, rate limits, realtime fan-out |
| Job queue / workflows | **Temporal** (preferred) or BullMQ | Long waits ("wait 3 days"), retries, durable timers for automations |
| Event bus | Kafka / Redpanda (later), start with Postgres outbox + Redis streams | Triggers for workflows and webhooks |
| Search | OpenSearch or Typesense | Contact search, smart lists at scale |
| Analytics store | ClickHouse | Email opens, page views, call logs, reporting |
| Files | S3 + CloudFront (or R2) | Media library, recordings |
| Realtime | WebSockets (Socket.IO / Ably / Pusher) | Unified inbox, notifications |
| Auth | Clerk / WorkOS / Auth.js + own RBAC; SSO, 2FA | Agency/sub-account roles |
| Custom domains + SSL | Cloudflare for SaaS (Custom Hostnames) or Caddy on-demand TLS | Client funnels on their own domains |
| Mobile app | React Native (Expo), white-label builds via EAS | GHL's "LeadConnector" app plus a branded app |
| Infra | AWS (ECS/EKS) or Fly/Render to start; Terraform; GitHub Actions | |
| Observability | OpenTelemetry → Grafana/Datadog, Sentry | |

---

## 1. Feature-by-feature breakdown

### 1.1 CRM / Contacts
- Contacts, companies, custom fields/values, tags, notes, tasks, activity timeline, DND per channel, merging duplicates, CSV import/export, bulk actions.
- **Smart Lists**: saved dynamic filters (tag, field, stage, last activity).
- **Stack**: Postgres (JSONB for custom fields + GIN index), Typesense/OpenSearch for filters, CSV import worker (Papaparse/streaming + queue).

### 1.2 Opportunities / Pipelines
- Multiple pipelines, Kanban stages, value, owner, lost reasons, stage triggers.
- **Stack**: dnd-kit for Kanban; stage-change events → workflow engine.

### 1.3 Unified Inbox / Conversations
- SMS, MMS, email, FB Messenger, Instagram DM, WhatsApp, Google Business chat, web chat, live chat widget, calls. Single thread per contact; assign, snooze, internal comments.
- **Stack**:
  - SMS/voice: **Twilio** (or Telnyx/Bandwidth, which are cheaper) with A2P 10DLC brand/campaign registration API
  - Email: **Mailgun / Amazon SES / Postmark** + inbound parse webhooks; dedicated IP pools; DKIM/SPF/DMARC setup wizard
  - Meta: Graph API (Messenger, IG), **WhatsApp Cloud API**
  - Web chat widget: embeddable Preact bundle + WebSocket
  - Normalize all channels into one `messages` table; Socket.IO for live updates

### 1.4 Phone system (GHL "LC Phone")
- Number buying/porting, call tracking, forwarding, IVR, call recording, transcription, voicemail drops, power dialer, missed-call text-back, browser + mobile softphone.
- **Stack**: Twilio Voice (TwiML/Programmable Voice) or Telnyx Call Control; Twilio Voice JS SDK / WebRTC; Deepgram/AssemblyAI for transcription; Twilio subaccounts per location (isolation + billing).

### 1.5 Email marketing (GHL "LC Email")
- Drag-drop email builder, templates, campaigns, A/B, scheduling, open/click tracking, unsubscribe management, domain verification.
- **Stack**: **GrapesJS** (or Unlayer/Easy Email/react-email) builder → MJML render; SES/Mailgun send; ClickHouse event store; warm-up and suppression list logic.

### 1.6 Workflows / Automations (most complex piece)
- Visual builder: triggers (form submit, tag added, stage change, appointment, payment, inbound message, webhook, date/birthday…), actions (send SMS/email, wait, if/else, goal, add tag, create opp, webhook, AI step, custom code, math, update field), A/B split, goal events, re-entry rules, execution logs.
- **Stack**:
  - Canvas: **React Flow (xyflow)**
  - Definition: JSON DAG, versioned
  - Runtime: **Temporal** workflows (durable timers, retries, per-contact execution) — alternative: Inngest / Trigger.dev for faster start
  - Custom code action: isolated-vm or Cloudflare Workers / Deno sandbox
  - Expression/merge fields: Liquid (liquidjs) for `{{contact.first_name}}`

### 1.7 Calendars / Booking
- Round-robin, group, class, collective, service menus; availability, buffers, reminders, Google/Outlook/iCal 2-way sync, Zoom/Meet links, payments at booking, embeddable widget.
- **Stack**: Google Calendar API, Microsoft Graph, CalDAV; **Nylas** or **Cronofy** to skip sync work; rrule.js, date-fns-tz; Zoom API. Option: fork **Cal.com** (AGPL; commercial license needed for closed SaaS).

### 1.8 Funnels & Website builder
- Drag-drop page builder, multi-step funnels, templates, A/B split, custom domains, SEO meta, custom code, popups, order forms/one-click upsells, blog.
- **Stack**: **GrapesJS** or **Puck** (React-native editor) or Craft.js; JSON page schema → rendered by Next.js edge (ISR) on custom domains; Cloudflare for SaaS for SSL; image optimization via Cloudflare Images/imgproxy.

### 1.9 Forms, Surveys, Quizzes, Chat widget
- Drag-drop fields, conditional logic, multi-step, hidden UTM capture, spam protection.
- **Stack**: JSON schema forms (react-hook-form + zod), hCaptcha/Turnstile, embeddable iframe/script.

### 1.10 Payments / Invoicing / E-commerce
- Stripe/PayPal/Square/Authorize.net/NMI integrations, products, subscriptions, invoices, estimates, text-to-pay, coupons, order forms, store, documents/contracts.
- **Stack**: **Stripe Connect** (Standard/Express per sub-account) as core; PayPal Commerce; invoice PDFs via React-PDF/Playwright; tax via Stripe Tax.

### 1.11 Documents & Contracts (e-sign)
- Template-based proposals, e-signature, audit trail.
- **Stack**: own signing flow (pdf-lib + signature canvas + audit hash) or **Documenso** (open source) / DocuSign/Dropbox Sign APIs.

### 1.12 Memberships / Courses / Communities
- Course builder, drip content, quizzes, certificates, video hosting, communities (groups, posts, gamification), client portal.
- **Stack**: **Mux** or Cloudflare Stream for video; Postgres for content; Tiptap editor; Stream (getstream.io) or own feeds for communities.

### 1.13 Social Planner
- Schedule/publish to FB, IG, LinkedIn, X, TikTok, GMB, YouTube, Pinterest; calendar view; CSV bulk; AI captions.
- **Stack**: each platform's API (Meta Graph, LinkedIn Marketing, X API v2, TikTok Content Posting, YouTube Data, GBP API); or shortcut via **Ayrshare** API; scheduled jobs in Temporal/BullMQ.

### 1.14 Reputation Management
- Review requests via SMS/email, Google/Facebook review monitoring, AI replies, review widgets.
- **Stack**: Google Business Profile API, Meta Graph; LLM for replies; embeddable review widget.

### 1.15 Ads Manager / Attribution / Reporting
- FB/Google/TikTok ad reporting and lead sync, attribution (first/last touch), call reporting, agency dashboards, custom widgets.
- **Stack**: Meta Marketing API + Lead Ads webhooks, Google Ads API, TikTok Ads API; UTM + cookie tracking script; ClickHouse + Recharts/Tremor dashboards.

### 1.16 AI Employee suite
| GHL module | What it does | Stack |
|---|---|---|
| Conversation AI | Bot replies on SMS/chat/DM, books appointments, multi-language | Claude (Sonnet 5.5 for quality, Haiku 5.5 for volume) + tool calling (book_appointment, update_contact) |
| Voice AI | Inbound/outbound phone agents | **Vapi / Retell / LiveKit Agents** + Twilio SIP; STT Deepgram, TTS ElevenLabs/Cartesia, LLM Claude |
| Content AI | Copy for emails, funnels, socials, blogs, images | Claude + image API |
| Reviews AI | Auto review responses | Claude |
| Workflow AI / Ask AI | Build automations from prompt, ask questions about CRM data | Claude with structured output → workflow JSON; text-to-SQL over read replica |
| Knowledge base (RAG) | Train bots on site/docs | pgvector + embeddings, Firecrawl for site crawl |
| Agent Studio / MCP | Custom agents, external AI access | Expose own **MCP server** over the public API |

### 1.17 Agency / SaaS mode / White-label
- Agency dashboard, sub-account snapshots (cloneable templates of funnels+workflows+calendars), SaaS plans with Stripe billing for clients, **rebilling** of SMS/email/AI usage with markup, wallet top-ups, white-label domain/app/branding, affiliate manager.
- **Stack**:
  - Snapshots: export/import JSON of all location-scoped assets with ID remapping
  - Billing: Stripe Billing (subscriptions) + usage-based metering (Stripe Meters or **Lago/Orb**) + prepaid wallet ledger (double-entry table)
  - White-label: per-agency theme tokens, custom domain for app (`app.agency.com`), branded email sender, white-label mobile app builds
  - Affiliate manager: own (referral links + commission ledger) or Rewardful/FirstPromoter

### 1.18 Integrations / Marketplace / API
- Public REST API v2, OAuth 2.0 apps, webhooks, marketplace, Zapier/Make, Google Sheets, QuickBooks, Slack.
- **Stack**: OpenAPI spec, OAuth server (ory/hydra or own), Svix for outbound webhooks, Zapier/Make developer platform apps.

### 1.19 Mobile app
- Inbox, calls, contacts, opportunities, notifications, communities.
- **Stack**: Expo React Native, FCM/APNs push (Expo Notifications), Twilio Voice RN SDK / CallKit.

### 1.20 Compliance & ops
- A2P 10DLC, TCPA consent capture, CAN-SPAM, GDPR/CCPA export-delete, HIPAA mode (BAA), SOC 2.
- **Stack**: consent ledger table, audit log, encrypted PII columns (pgcrypto/KMS), Vanta/Drata for SOC 2.

---

## 2. Build order (MVP → parity)

| Phase | Scope | Rough effort (2–4 eng) |
|---|---|---|
| 1. Foundation | Multi-tenant auth/RBAC, contacts, tags, custom fields, smart lists, pipelines | 6–8 wks |
| 2. Comms | Unified inbox: SMS (Twilio), email (SES), web chat; templates | 6–8 wks |
| 3. Automation | Workflow builder + Temporal runtime, 20 core triggers/actions | 8–10 wks |
| 4. Capture | Forms, calendars + Google sync, funnel/page builder + custom domains | 10–12 wks |
| 5. Money | Stripe Connect payments, invoices, SaaS plans, wallet + rebilling | 6–8 wks |
| 6. AI | Conversation AI, Content AI, RAG KB; then Voice AI | 6–8 wks |
| 7. Growth | Social planner, reputation, email builder/campaigns, reporting/ads | 10–12 wks |
| 8. Platform | Snapshots, white-label, public API/webhooks, mobile app, courses/communities | 12–16 wks |

≈ 12–18 months to rough parity with a small team. MVP that sells to agencies (phases 1–4 + snapshots) takes ~6–8 months.

## 3. Buy-vs-build shortcuts
- Calendar sync → Nylas/Cronofy
- Voice AI → Vapi/Retell
- Social posting → Ayrshare
- Webhooks out → Svix
- Usage billing → Lago (open source)
- E-sign → Documenso
- Page builder → GrapesJS/Puck
- Workflow runtime → Temporal Cloud / Inngest

## 4. Monthly infra cost at start (rough)
Hosting + DB + Redis ~$300–800; Temporal Cloud ~$200+; Twilio/SES/LLM pass-through (rebilled to clients); Sentry/Datadog ~$100–300.

## 5. Risks
- Telecom compliance (A2P 10DLC, STIR/SHAKEN) slows SMS launch by weeks; start registration early.
- Email deliverability across shared IPs: one bad tenant can hurt everyone. Use IP pools and send-reputation gating.
- Workflow engine correctness (idempotency, re-entry, timezones) is the main source of bugs.
- Don't copy GHL branding, templates, or UI assets. Build an original product.
