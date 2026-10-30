import type Anthropic from '@anthropic-ai/sdk';

export interface Business {
  id: string;
  name: string;
  twilio_number: string | null;
  forward_to: string | null;
  owner_phone: string | null;
  time_zone: string;
  hours: Record<string, string | null>;
  services: string[];
  faq: string;
  slot_minutes: number;
  missed_call_text: string | null;
  brand_color: string;
  logo_url: string | null;
  ai_enabled: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  role: 'admin' | 'client';
  business_id: string | null;
}

export type Channel = 'sms' | 'test';

export interface Conversation {
  id: string;
  business_id: string;
  channel: Channel;
  contact_phone: string;
  contact_name: string | null;
  ai_paused: boolean;
  history: Anthropic.MessageParam[];
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  business_id: string;
  direction: 'inbound' | 'outbound';
  sender: 'contact' | 'ai' | 'human' | 'system';
  body: string;
  created_at: string;
}

export interface Booking {
  id: string;
  business_id: string;
  conversation_id: string | null;
  contact_name: string;
  contact_phone: string | null;
  service: string | null;
  notes: string | null;
  starts_at: string;
  ends_at: string;
  source: 'sms' | 'voice' | 'test' | 'manual';
  status: 'confirmed' | 'cancelled';
  created_at: string;
}
