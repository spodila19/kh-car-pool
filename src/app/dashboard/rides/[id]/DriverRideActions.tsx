'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function DriverRideActions({ rideId }: { rideId: string }) {
  const [loading, setLoading] = useState<'start' | 'cancel' | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleStartRide() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoading('start');
    await supabase
      .from('rides')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', rideId)
      .eq('driver_id', user.id);
    setLoading(null);
    router.refresh();
  }

  async function handleCancelRide() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoading('cancel');
    await supabase
      .from('rides')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', rideId)
      .eq('driver_id', user.id);
    setLoading('cancel');
    setShowCancelConfirm(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleStartRide}
        disabled={!!loading}
        className="w-full py-2.5 rounded-xl bg-accent-green text-white font-medium disabled:opacity-50"
      >
        {loading === 'start' ? 'Starting…' : 'Start ride'}
      </button>
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
        After starting, you can share your location for live tracking.
      </p>
      <button
        type="button"
        onClick={() => setShowCancelConfirm(true)}
        disabled={!!loading}
        className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium disabled:opacity-50"
      >
        Cancel ride
      </button>

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Cancel this ride?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              The ride will be cancelled for everyone. Approved riders will no longer see this ride or live tracking.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium"
              >
                Keep ride
              </button>
              <button
                type="button"
                onClick={handleCancelRide}
                disabled={loading === 'cancel'}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white font-medium disabled:opacity-50"
              >
                {loading === 'cancel' ? 'Cancelling…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
