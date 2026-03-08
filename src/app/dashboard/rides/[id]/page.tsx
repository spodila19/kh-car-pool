import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { RequestRideButton } from './RequestRideButton';
import { LiveTrackLink } from './LiveTrackLink';
import { ApproveRejectButtons } from './ApproveRejectButtons';

export default async function RideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: ride } = await supabase
    .from('rides')
    .select(`
      *,
      profiles ( display_name, phone )
    `)
    .eq('id', id)
    .single();

  if (!ride) notFound();

  const { data: requests } = await supabase
    .from('ride_requests')
    .select(`
      id,
      user_id,
      pickup_place,
      status,
      created_at,
      profiles ( display_name, phone )
    `)
    .eq('ride_id', id)
    .order('created_at', { ascending: false });

  const myRequest = requests?.find((r: any) => r.user_id === user.id);
  const isDriver = ride.driver_id === user.id;
  const isApproved = myRequest?.status === 'approved';
  const canRequest = !isDriver && !myRequest && ride.status !== 'cancelled' && ride.seats_available > 0;

  return (
    <div>
      <Link href="/dashboard" className="text-primary-600 hover:underline text-sm mb-4 inline-block">
        ← Back to rides
      </Link>
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <p className="font-medium text-slate-800 dark:text-slate-200">
            {ride.from_place} → {ride.to_place}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {format(new Date(ride.departure_time), 'EEEE, d MMMM yyyy · h:mm a')}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Driver: {ride.profiles?.display_name ?? '—'}
            {ride.profiles?.phone && (
              <span className="ml-2">· {ride.profiles.phone}</span>
            )}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {ride.seats_available} seat{ride.seats_available !== 1 ? 's' : ''} · {ride.status}
          </p>
          {ride.notes && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">{ride.notes}</p>
          )}
        </div>

        {(isDriver || isApproved) && (ride.status === 'scheduled' || ride.status === 'active') && (
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border-b border-slate-200 dark:border-slate-700">
            <LiveTrackLink rideId={ride.id} isDriver={isDriver} />
          </div>
        )}

        {canRequest && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <RequestRideButton rideId={ride.id} />
          </div>
        )}

        {myRequest && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm">
              Your request: <strong>{myRequest.status}</strong>
            </p>
          </div>
        )}

        {isDriver && requests && requests.length > 0 && (
          <div className="p-4">
            <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Requests</h3>
            <ul className="space-y-2">
              {requests.map((req: any) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {req.profiles?.display_name ?? 'Rider'}
                    </p>
                    {req.pickup_place && (
                      <p className="text-xs text-slate-500">Pickup: {req.pickup_place}</p>
                    )}
                  </div>
                  <ApproveRejectButtons
                    requestId={req.id}
                    status={req.status}
                    rideId={ride.id}
                    seatsAvailable={ride.seats_available}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
