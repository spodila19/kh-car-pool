'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPhone, setShowPhone] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name ?? '');
        setPhone(data.phone ?? '');
        setShowPhone(data.show_phone ?? true);
      }
    })();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError('Mobile number is required.');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    const { error: err } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || 'Rider',
        phone: trimmedPhone,
        show_phone: showPhone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    setSaving(false);
    if (err) setError(err.message);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
        Profile
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Mobile number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            required
            className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
          />
          <p className="text-xs text-slate-500 mt-1">
            Required. Shown to drivers and other riders only if you enable it below.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="show_phone"
            checked={showPhone}
            onChange={(e) => setShowPhone(e.target.checked)}
            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="show_phone" className="text-sm text-slate-700 dark:text-slate-300">
            Show my mobile number to drivers and other riders
          </label>
        </div>
        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-primary-600 text-white font-medium disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={handleSignOut}
          className="text-slate-500 hover:text-red-600 text-sm"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
