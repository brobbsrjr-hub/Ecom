import Link from 'next/link';
import { formatPhone } from '@/lib/format';
import { userClient } from '@/lib/supabase/server';
import type { Business } from '@/lib/types';

export default async function AdminHome() {
  const db = await userClient();
  const { data } = await db
    .from('businesses')
    .select('id, name, twilio_number, ai_enabled, brand_color')
    .order('created_at', { ascending: false });
  const businesses = (data ?? []) as Pick<Business, 'id' | 'name' | 'twilio_number' | 'ai_enabled' | 'brand_color'>[];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <Link href="/admin/new" className="btn">Add client</Link>
      </div>
      {businesses.length === 0 ? (
        <p className="card p-6 text-sm text-slate-600">No clients yet. Add your first one to set up their AI receptionist.</p>
      ) : (
        <ul className="card divide-y divide-slate-200">
          {businesses.map((b) => (
            <li key={b.id}>
              <Link href={`/b/${b.id}/inbox`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50">
                <span className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: b.brand_color }} />
                  <span className="font-medium">{b.name}</span>
                </span>
                <span className="text-sm text-slate-500">
                  {b.twilio_number ? formatPhone(b.twilio_number) : 'No number yet'} · AI {b.ai_enabled ? 'on' : 'off'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
