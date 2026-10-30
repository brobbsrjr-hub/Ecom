import { notFound } from 'next/navigation';
import { BusinessForm } from '@/components/BusinessForm';
import { SubmitButton } from '@/components/SubmitButton';
import { businessById } from '@/lib/businesses';
import { requireProfile, userClient } from '@/lib/supabase/server';
import { inviteClientUser, updateBusiness } from '../actions';

export default async function Settings({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; invited?: string }>;
}) {
  const { id } = await params;
  const { error, saved, invited } = await searchParams;
  const profile = await requireProfile();
  const business = await businessById(await userClient(), id);
  if (!business) notFound();
  const isAdmin = profile.role === 'admin';

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>
      <BusinessForm
        action={updateBusiness.bind(null, id)}
        business={business}
        isAdmin={isAdmin}
        error={error}
        saved={Boolean(saved)}
      />
      {isAdmin && (
        <section className="card mt-8 space-y-3 p-5">
          <h2 className="font-semibold">Give the client access</h2>
          <p className="text-sm text-slate-600">They get an email invite and can only see this business.</p>
          {invited && <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">Invite sent to {invited}.</p>}
          <form action={inviteClientUser.bind(null, id)} className="flex gap-2">
            <input type="email" name="email" required placeholder="owner@business.com" className="input" />
            <SubmitButton>Send invite</SubmitButton>
          </form>
        </section>
      )}
    </>
  );
}
