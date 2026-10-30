import { redirect } from 'next/navigation';
import { requireProfile } from '@/lib/supabase/server';

export default async function Home() {
  const profile = await requireProfile();
  if (profile.role === 'admin') redirect('/admin');
  if (profile.business_id) redirect(`/b/${profile.business_id}/inbox`);
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Your account isn&apos;t linked to a business yet</h1>
      <p className="mt-2 text-sm text-slate-600">Ask your account manager to finish setup.</p>
    </main>
  );
}
