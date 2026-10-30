import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizePhone } from './sms';
import type { Business } from './types';

export async function businessByNumber(db: SupabaseClient, number: string): Promise<Business | null> {
  const { data } = await db
    .from('businesses')
    .select('*')
    .eq('twilio_number', normalizePhone(number))
    .maybeSingle();
  return (data as Business | null) ?? null;
}

export async function businessById(db: SupabaseClient, id: string): Promise<Business | null> {
  const { data } = await db.from('businesses').select('*').eq('id', id).maybeSingle();
  return (data as Business | null) ?? null;
}
