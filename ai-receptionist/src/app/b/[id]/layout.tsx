import Link from 'next/link';
import { notFound } from 'next/navigation';
import { businessById } from '@/lib/businesses';
import { requireBusinessAccess, userClient } from '@/lib/supabase/server';
import { Nav } from './Nav';

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireBusinessAccess(id);
  const business = await businessById(await userClient(), id);
  if (!business) notFound();

  return (
    <div className="min-h-screen" style={{ '--brand': business.brand_color } as React.CSSProperties}>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            {profile.role === 'admin' && (
              <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-800">← Clients</Link>
            )}
            {business.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo_url} alt="" className="h-8 w-auto" />
            ) : (
              <span className="h-8 w-8 rounded-md" style={{ background: business.brand_color }} />
            )}
            <span className="font-semibold">{business.name}</span>
          </div>
          <form action="/auth/signout" method="post">
            <button className="btn-ghost">Sign out</button>
          </form>
        </div>
        <Nav businessId={id} />
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
