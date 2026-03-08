'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Check your email
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            We sent a sign-in link to <strong>{email}</strong>. Click it to log in.
          </p>
          <button
            type="button"
            onClick={() => { setSent(false); setEmail(''); }}
            className="text-primary-600 hover:underline"
          >
            Use a different email
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-primary-600 hover:underline text-sm mb-4 inline-block">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Sign in
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Enter your email. We’ll send you a one-time link to sign in. Add your mobile number in your profile after signing in.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl bg-primary-600 text-white font-medium shadow hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send sign-in link'}
          </button>
        </form>
      </div>
    </main>
  );
}
