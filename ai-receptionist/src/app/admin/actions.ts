'use server';

import { redirect } from 'next/navigation';
import { parseBusinessForm } from '@/lib/businessForm';
import { requireAdmin, userClient } from '@/lib/supabase/server';

export async function createBusiness(form: FormData): Promise<void> {
  await requireAdmin();
  const parsed = parseBusinessForm(form, true);
  if (!parsed.ok) redirect(`/admin/new?error=${encodeURIComponent(parsed.error)}`);

  const db = await userClient();
  const { data, error } = await db.from('businesses').insert(parsed.fields).select('id').single();
  if (error) redirect(`/admin/new?error=${encodeURIComponent(error.message)}`);
  redirect(`/b/${data.id}/test`);
}
