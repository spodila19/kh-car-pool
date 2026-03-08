'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function NewRidePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    from_place: 'Kanha Shanti Vanam',
    to_place: '',
    departure_date: '',
    departure_time: '',
    seats_available: 3,
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const departure = new Date(`${form.departure_date}T${form.departure_time}`);
    if (isNaN(departure.getTime()) || departure < new Date()) {
      setError('Please choose a future date and time.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.from('rides').insert({
      driver_id: user.id,
      from_place: form.from_place.trim(),
      to_place: form.to_place.trim(),
      departure_time: departure.toISOString(),
      seats_available: Math.max(1, form.seats_available),
      notes: form.notes.trim() || null,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    await supabase.from('profiles').update({ is_driver: true }).eq('id', user.id);
    router.push('/dashboard');
    router.refresh();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
        Offer a ride
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From</label>
          <input
            type="text"
            value={form.from_place}
            onChange={(e) => setForm((f) => ({ ...f, from_place: e.target.value }))}
            placeholder="e.g. Kanha Shanti Vanam"
            required
            className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To</label>
          <input
            type="text"
            value={form.to_place}
            onChange={(e) => setForm((f) => ({ ...f, to_place: e.target.value }))}
            placeholder="e.g. Gachibowli, HITEC City"
            required
            className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={form.departure_date}
              min={today}
              onChange={(e) => setForm((f) => ({ ...f, departure_date: e.target.value }))}
              required
              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
            <input
              type="time"
              value={form.departure_time}
              onChange={(e) => setForm((f) => ({ ...f, departure_time: e.target.value }))}
              required
              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Seats available</label>
          <input
            type="number"
            min={1}
            max={6}
            value={form.seats_available}
            onChange={(e) => setForm((f) => ({ ...f, seats_available: parseInt(e.target.value, 10) || 1 }))}
            className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Landmark, pickup point, etc."
            rows={2}
            className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 resize-none"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary-600 text-white font-medium disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create ride'}
        </button>
      </form>
    </div>
  );
}
