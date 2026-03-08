'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function EndRideButton({ rideId }: { rideId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleEndRide() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoading(true);
    await supabase
      .from('rides')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', rideId)
      .eq('driver_id', user.id);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleEndRide}
      disabled={loading}
      className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium disabled:opacity-50 mt-2"
    >
      {loading ? 'Ending…' : 'End ride'}
    </button>
  );
}
