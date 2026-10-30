'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: 'inbox', label: 'Inbox' },
  { href: 'test', label: 'Test chat' },
  { href: 'bookings', label: 'Bookings' },
  { href: 'settings', label: 'Settings' },
];

export function Nav({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  return (
    <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
      {TABS.map((tab) => {
        const href = `/b/${businessId}/${tab.href}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
              active ? 'border-[var(--brand)] font-medium text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
