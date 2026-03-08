'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function RequestRideButton({ rideId }: { rideId: string }) {
  const [pickup, setPickup] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRequest() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('ride_requests').insert({
      ride_id: rideId,
      user_id: user.id,
      pickup_place: pickup.trim() || null,
    });
    setLoading(false);
    if (!error) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Your pickup location (optional)"
        value={pickup}
        onChange={(e) => setPickup(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
      />
      <button
        type="button"
        onClick={handleRequest}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-primary-600 text-white font-medium text-sm disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Request to join'}
      </button>
    </div>
  );
}
