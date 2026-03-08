import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: rides } = await supabase
    .from('rides')
    .select(`
      id,
      from_place,
      to_place,
      departure_time,
      seats_available,
      seats_total,
      status,
      profiles ( display_name )
    `)
    .gte('departure_time', new Date().toISOString())
    .in('status', ['scheduled', 'active'])
    .order('departure_time', { ascending: true })
    .limit(50);

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
        Upcoming rides
      </h1>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
        Near Kanha Shanti Vanam · Join a ride or offer your own.
      </p>

      {!rides?.length ? (
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
          No upcoming rides. Be the first to{' '}
          <Link href="/dashboard/rides/new" className="text-primary-600 hover:underline">
            offer a ride
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {rides.map((ride: any) => (
            <li key={ride.id}>
              <Link
                href={`/dashboard/rides/${ride.id}`}
                className="block rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 hover:border-primary-400 dark:hover:border-primary-500 transition"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {ride.from_place} → {ride.to_place}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {format(new Date(ride.departure_time), 'EEE, d MMM · h:mm a')}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {ride.profiles?.display_name ?? 'Ride host'} · {ride.seats_available} of {ride.seats_total ?? ride.seats_available} seat{(ride.seats_total ?? ride.seats_available) !== 1 ? 's' : ''} remaining
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                      ride.status === 'active'
                        ? 'bg-accent-green/20 text-accent-green'
                        : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    }`}
                  >
                    {ride.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
