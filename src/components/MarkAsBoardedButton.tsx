'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function MarkAsBoardedButton({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleMarkBoarded() {
    setLoading(true);
    await supabase
      .from('ride_requests')
      .update({ boarded_at: new Date().toISOString() })
      .eq('id', requestId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleMarkBoarded}
      disabled={loading}
      className="w-full py-2.5 rounded-xl bg-accent-green text-white font-medium text-sm disabled:opacity-50"
    >
      {loading ? 'Marking…' : 'Mark as boarded'}
    </button>
  );
}
