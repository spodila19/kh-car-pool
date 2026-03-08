'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function ApproveRejectButtons({
  requestId,
  status,
  rideId,
  seatsAvailable,
}: {
  requestId: string;
  status: string;
  rideId: string;
  seatsAvailable: number;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  if (status !== 'pending') {
    return <span className="text-sm text-slate-500 capitalize">{status}</span>;
  }

  async function handleApprove() {
    if (seatsAvailable < 1) return;
    setLoading(true);
    await supabase.from('ride_requests').update({ status: 'approved' }).eq('id', requestId);
    const { data: ride } = await supabase.from('rides').select('seats_available').eq('id', rideId).single();
    if (ride) {
      await supabase.from('rides').update({
        seats_available: ride.seats_available - 1,
        updated_at: new Date().toISOString(),
      }).eq('id', rideId);
    }
    setLoading(false);
    router.refresh();
  }

  async function handleReject() {
    setLoading(true);
    await supabase.from('ride_requests').update({ status: 'rejected' }).eq('id', requestId);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleApprove}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg bg-accent-green text-white text-sm font-medium disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={handleReject}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
