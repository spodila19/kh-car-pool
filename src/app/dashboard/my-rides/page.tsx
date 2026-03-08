import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function MyRidesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: driven } = await supabase
    .from('rides')
    .select('id, from_place, to_place, departure_time, status, seats_available')
    .eq('driver_id', user.id)
    .in('status', ['scheduled', 'active'])
    .order('departure_time', { ascending: true })
    .limit(20);

  const { data: drivenPast } = await supabase
    .from('rides')
    .select('id, from_place, to_place, departure_time, status')
    .eq('driver_id', user.id)
    .in('status', ['completed', 'cancelled'])
    .order('departure_time', { ascending: false })
    .limit(10);

  const { data: requests } = await supabase
    .from('ride_requests')
    .select(`
      id,
      status,
      created_at,
      rides ( id, from_place, to_place, departure_time, status )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
        My rides
      </h1>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Rides I’m driving</h2>
        {!driven?.length ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">No upcoming rides. Offer a ride from the dashboard.</p>
        ) : (
          <ul className="space-y-3">
            {driven.map((ride: any) => (
              <li key={ride.id}>
                <Link
                  href={`/dashboard/rides/${ride.id}`}
                  className="block rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4"
                >
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {ride.from_place} → {ride.to_place}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {format(new Date(ride.departure_time), 'EEE, d MMM · h:mm a')} · {ride.status}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {drivenPast && drivenPast.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Past rides</h2>
          <ul className="space-y-3">
            {drivenPast.map((ride: any) => (
              <li key={ride.id}>
                <Link
                  href={`/dashboard/rides/${ride.id}`}
                  className="block rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 opacity-75"
                >
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {ride.from_place} → {ride.to_place}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {format(new Date(ride.departure_time), 'EEE, d MMM · h:mm a')} · {ride.status}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Rides I requested</h2>
        {!requests?.length ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">No join requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((r: any) => (
              <li key={r.id}>
                <Link
                  href={r.rides ? `/dashboard/rides/${r.rides.id}` : '#'}
                  className="block rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4"
                >
                  {r.rides && (
                    <>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {r.rides.from_place} → {r.rides.to_place}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {format(new Date(r.rides.departure_time), 'EEE, d MMM · h:mm a')}
                      </p>
                    </>
                  )}
                  <p className="text-xs text-slate-500 mt-1">Request: <strong>{r.status}</strong></p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
