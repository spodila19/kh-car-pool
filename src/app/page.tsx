import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="text-center max-w-sm">
          <h1 className="text-3xl font-bold text-primary-700 dark:text-primary-400 mb-2">
            Kanha Car Pool
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Kanha Shanti Vanam Community · Share rides, save the planet.
          </p>
          <Link
            href="/auth/login"
            className="inline-block w-full py-3 px-6 rounded-xl bg-primary-600 text-white font-medium shadow-lg hover:bg-primary-700 transition"
          >
            Sign in to continue
          </Link>
        </div>
      </main>
    );
  }

  redirect('/dashboard');
}
