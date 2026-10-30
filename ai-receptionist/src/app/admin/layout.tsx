import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-semibold">Agency admin</Link>
          <form action="/auth/signout" method="post" className="flex items-center gap-3 text-sm text-slate-600">
            <span className="hidden sm:inline">{profile.email}</span>
            <button className="btn-ghost">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
