import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Profile } from '../types';

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

// Acts as the signed-in user. Row-level security limits what they can see.
export async function userClient() {
  const cookieStore = await cookies();
  return createServerClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; the proxy refreshes the session instead.
        }
      },
    },
  });
}

// Bypasses RLS. Only for webhooks and admin actions after an explicit role check.
export function serviceClient() {
  return createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireProfile(): Promise<Profile> {
  const supabase = await userClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, business_id')
    .eq('id', user.id)
    .single();
  if (!profile) redirect('/login?error=no-profile');
  return profile as Profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== 'admin') redirect('/');
  return profile;
}

// Admins can open any business; clients only their own.
export async function requireBusinessAccess(businessId: string): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== 'admin' && profile.business_id !== businessId) redirect('/');
  return profile;
}
