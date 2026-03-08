import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 safe-bottom">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-slate-800 dark:text-slate-200">
            Kanha Car Pool
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard/rides/new" className="text-primary-600 dark:text-primary-400 text-sm font-medium">
              Offer ride
            </Link>
            <Link href="/dashboard/my-rides" className="text-slate-600 dark:text-slate-400 text-sm">
              My rides
            </Link>
            <Link href="/dashboard/profile" className="text-slate-600 dark:text-slate-400 text-sm">
              Profile
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-24 safe-bottom">
        {children}
      </main>
    </div>
  );
}
