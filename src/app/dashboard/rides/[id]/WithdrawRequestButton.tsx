'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function WithdrawRequestButton({
  requestId,
  rideId,
  currentStatus,
}: {
  requestId: string;
  rideId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleWithdraw() {
    setLoading(true);
    await supabase.from('ride_requests').update({ status: 'withdrawn' }).eq('id', requestId);
    if (currentStatus === 'approved') {
      const { data: ride } = await supabase.from('rides').select('seats_available').eq('id', rideId).single();
      if (ride) {
        await supabase.from('rides').update({
          seats_available: ride.seats_available + 1,
          updated_at: new Date().toISOString(),
        }).eq('id', rideId);
      }
    }
    setLoading(false);
    setShowConfirm(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="text-sm text-slate-500 hover:text-red-600 dark:hover:text-red-400 underline disabled:opacity-50"
      >
        {loading ? 'Withdrawing…' : 'Withdraw request'}
      </button>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowConfirm(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Withdraw your request?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {currentStatus === 'approved'
                ? 'You will no longer be part of this ride. The seat will become available for others.'
                : 'Your request will be withdrawn.'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium"
              >
                Keep request
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white font-medium disabled:opacity-50"
              >
                {loading ? 'Withdrawing…' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
