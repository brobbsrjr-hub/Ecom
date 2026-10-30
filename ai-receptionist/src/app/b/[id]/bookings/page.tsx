import { SubmitButton } from '@/components/SubmitButton';
import { businessById } from '@/lib/businesses';
import { formatDateTime } from '@/lib/format';
import { userClient } from '@/lib/supabase/server';
import type { Booking } from '@/lib/types';
import { cancelBooking } from '../actions';

export default async function Bookings({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await userClient();
  const business = await businessById(db, id);
  const { data } = await db
    .from('bookings')
    .select('*')
    .eq('business_id', id)
    .eq('status', 'confirmed')
    .gte('ends_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(200);
  const bookings = (data ?? []) as Booking[];
  const tz = business?.time_zone ?? 'UTC';

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Upcoming bookings</h1>
      {bookings.length === 0 ? (
        <p className="card p-6 text-sm text-slate-600">No upcoming bookings.</p>
      ) : (
        <ul className="card divide-y divide-slate-200">
          {bookings.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="font-medium">
                  {formatDateTime(b.starts_at, tz)} · {b.contact_name}
                  {b.source === 'test' && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">test</span>
                  )}
                </div>
                <div className="text-sm text-slate-600">
                  {[b.service, b.contact_phone, b.notes].filter(Boolean).join(' · ')}
                </div>
              </div>
              <form action={cancelBooking.bind(null, id, b.id)}>
                <SubmitButton className="btn-ghost">Cancel</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
