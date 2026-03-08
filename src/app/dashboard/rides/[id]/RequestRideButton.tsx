'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function RequestRideButton({ rideId }: { rideId: string }) {
  const [pickup, setPickup] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function useMyLocation() {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPickup('Current location');
        setGettingLocation(false);
      },
      () => setGettingLocation(false)
    );
  }

  async function handleRequest() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('ride_requests').insert({
      ride_id: rideId,
      user_id: user.id,
      pickup_place: pickup.trim() || null,
      pickup_lat: pickupCoords?.lat ?? null,
      pickup_lng: pickupCoords?.lng ?? null,
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
        onClick={useMyLocation}
        disabled={gettingLocation}
        className="text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
      >
        {gettingLocation ? 'Getting location…' : 'Use my current location'}
      </button>
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
