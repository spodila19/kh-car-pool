import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { RequestRideButton } from './RequestRideButton';
import { LiveTrackLink } from './LiveTrackLink';
import { ApproveRejectButtons } from './ApproveRejectButtons';
import { DriverRideActions } from './DriverRideActions';
import { EndRideButton } from './EndRideButton';
import { WithdrawRequestButton } from './WithdrawRequestButton';
import { MarkAsBoardedButton } from '@/components/MarkAsBoardedButton';

export default async function RideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .single();

  const { data: ride, error: rideError } = await supabase
    .from('rides')
    .select('*')
    .eq('id', id)
    .single();

  if (rideError || !ride) notFound();

  const { data: driverProfile } = await supabase
    .from('profiles')
    .select('display_name, phone, show_phone')
    .eq('id', ride.driver_id)
    .single();

  const rideWithProfile = { ...ride, profiles: driverProfile };

  const { data: requests } = await supabase
    .from('ride_requests')
    .select(`
      id,
      user_id,
      pickup_place,
      pickup_lat,
      pickup_lng,
      status,
      boarded_at,
      created_at,
      profiles ( display_name, phone, show_phone )
    `)
    .eq('ride_id', id)
    .order('created_at', { ascending: false });

  const myRequest = requests?.find((r: any) => r.user_id === user.id);
  const isDriver = rideWithProfile.driver_id === user.id;
  const isApproved = myRequest?.status === 'approved';
  const canRequest = !isDriver && !myRequest && rideWithProfile.status !== 'cancelled' && rideWithProfile.seats_available > 0;
  const hasPhone = !!myProfile?.phone?.trim();

  return (
    <div>
      <Link href="/dashboard" className="text-primary-600 hover:underline text-sm mb-4 inline-block">
        ← Back to rides
      </Link>
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <p className="font-medium text-slate-800 dark:text-slate-200">
            {rideWithProfile.from_place} → {rideWithProfile.to_place}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {format(new Date(rideWithProfile.departure_time), 'EEEE, d MMMM yyyy · h:mm a')}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ride host: {rideWithProfile.profiles?.display_name ?? '—'}
            {rideWithProfile.profiles?.show_phone !== false && rideWithProfile.profiles?.phone && (
              <span className="ml-2">· {rideWithProfile.profiles.phone}</span>
            )}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {rideWithProfile.seats_available} of {rideWithProfile.seats_total ?? rideWithProfile.seats_available} seat{(rideWithProfile.seats_total ?? rideWithProfile.seats_available) !== 1 ? 's' : ''} remaining · {rideWithProfile.status}
          </p>
          {rideWithProfile.notes && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">{rideWithProfile.notes}</p>
          )}
        </div>

        {isDriver && rideWithProfile.status === 'scheduled' && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Ready to go?</h3>
            <DriverRideActions rideId={rideWithProfile.id} />
          </div>
        )}
        {isDriver && rideWithProfile.status === 'cancelled' && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/30">
            <p className="text-sm text-slate-600 dark:text-slate-400">This ride has been cancelled.</p>
          </div>
        )}
        {(isDriver || isApproved) && rideWithProfile.status === 'active' && (
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border-b border-slate-200 dark:border-slate-700 space-y-2">
            <LiveTrackLink rideId={rideWithProfile.id} isDriver={isDriver} />
            {isApproved && !myRequest?.boarded_at && (
              <MarkAsBoardedButton requestId={myRequest.id} />
            )}
            {isDriver && <EndRideButton rideId={rideWithProfile.id} />}
          </div>
        )}
        {rideWithProfile.status === 'completed' && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/30">
            <p className="text-sm text-slate-600 dark:text-slate-400">This ride has been completed.</p>
          </div>
        )}

        {canRequest && !hasPhone && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Add your <Link href="/dashboard/profile" className="underline font-medium">mobile number in Profile</Link> to request to join this ride.
            </p>
          </div>
        )}
        {canRequest && hasPhone && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <RequestRideButton rideId={rideWithProfile.id} />
          </div>
        )}

        {myRequest && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm">
              Your request: <strong className="capitalize">{myRequest.status}</strong>
              {(myRequest.status === 'approved' || myRequest.status === 'pending') && rideWithProfile.status !== 'cancelled' && rideWithProfile.status !== 'completed' && (
                <span className="block mt-2">
                  <WithdrawRequestButton
                    requestId={myRequest.id}
                    rideId={rideWithProfile.id}
                    currentStatus={myRequest.status}
                  />
                </span>
              )}
            </p>
          </div>
        )}

        {isDriver && requests && requests.length > 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-800 dark:text-slate-200">Requests</h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {rideWithProfile.seats_available} of {rideWithProfile.seats_total ?? rideWithProfile.seats_available} seat{(rideWithProfile.seats_total ?? rideWithProfile.seats_available) !== 1 ? 's' : ''} remaining
              </span>
            </div>
            <ul className="space-y-2">
              {requests.map((req: any) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {req.profiles?.display_name ?? 'Requester'}
                      {req.boarded_at && (
                        <span className="ml-2 text-xs font-normal text-accent-green">· Boarded</span>
                      )}
                    </p>
                    {req.pickup_place && (
                      <p className="text-xs text-slate-500">Pickup: {req.pickup_place}</p>
                    )}
                    {req.status === 'approved' && req.profiles?.show_phone !== false && req.profiles?.phone && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">📞 {req.profiles.phone}</p>
                    )}
                  </div>
                  <ApproveRejectButtons
                    requestId={req.id}
                    status={req.status}
                    rideId={rideWithProfile.id}
                    seatsAvailable={rideWithProfile.seats_available}
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
