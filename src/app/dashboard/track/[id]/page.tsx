'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

const TrackMap = dynamic(() => import('./TrackMap'), { ssr: false });
import { MarkAsBoardedButton } from '@/components/MarkAsBoardedButton';

export default function TrackPage() {
  const params = useParams();
  const router = useRouter();
  const rideId = params?.id as string;
  const [ride, setRide] = useState<{ from_place: string; to_place: string; driver_id: string; status: string } | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [myRequest, setMyRequest] = useState<{ id: string; boarded_at: string | null; pickup_lat: number | null; pickup_lng: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!rideId) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }
      const { data: rideData } = await supabase
        .from('rides')
        .select('from_place, to_place, driver_id, status')
        .eq('id', rideId)
        .single();
      if (!rideData) {
        setError('Ride not found');
        return;
      }
      const driver = rideData.driver_id === user.id;
      const { data: approved } = await supabase
        .from('ride_requests')
        .select('id, boarded_at, pickup_lat, pickup_lng')
        .eq('ride_id', rideId)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();
      if (!driver && !approved) {
        setError('You can only track this ride after your request is approved.');
        return;
      }
      if (rideData.status !== 'active') {
        setError(driver
          ? 'Start the ride from the ride page to begin sharing your location.'
          : 'Live tracking is available after the ride host starts the ride.');
        return;
      }
      setRide(rideData);
      setIsDriver(driver);
      if (!driver && approved) setMyRequest(approved);

      if (driver) {
        const sendLocation = () => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              supabase.from('driver_locations').upsert({
                ride_id: rideId,
                driver_id: user.id,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                updated_at: new Date().toISOString(),
              });
            },
            () => {}
          );
        };
        sendLocation();
        locationInterval.current = setInterval(sendLocation, 5000);
      } else if (approved) {
        const sendRiderLocation = () => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              supabase.from('rider_locations').upsert({
                ride_id: rideId,
                user_id: user.id,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                updated_at: new Date().toISOString(),
              });
            },
            () => {}
          );
        };
        sendRiderLocation();
        locationInterval.current = setInterval(sendRiderLocation, 5000);
      }
    })();
    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [rideId, supabase, router]);

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Link href="/dashboard" className="text-primary-600 hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-20 bg-white dark:bg-slate-900 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 safe-top">
        <Link href={`/dashboard/rides/${rideId}`} className="text-primary-600 hover:underline text-sm">
          ← Back
        </Link>
        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate max-w-[60%]">
          {ride.from_place} → {ride.to_place}
        </p>
        <span className="text-xs text-slate-500 w-12 text-right">
          {isDriver ? 'Sharing' : 'Tracking'}
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <TrackMap
          rideId={rideId}
          isDriver={isDriver}
          pickupLocation={!isDriver && myRequest?.pickup_lat && myRequest?.pickup_lng ? { lat: myRequest.pickup_lat, lng: myRequest.pickup_lng } : null}
        />
      </div>
      {!isDriver && myRequest && !myRequest.boarded_at && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 safe-bottom">
          <MarkAsBoardedButton requestId={myRequest.id} />
        </div>
      )}
    </div>
  );
}
