'use client';

import Link from 'next/link';

export function LiveTrackLink({
  rideId,
  isDriver,
}: {
  rideId: string;
  isDriver: boolean;
}) {
  return (
    <Link
      href={`/dashboard/track/${rideId}`}
      className="inline-flex items-center gap-2 text-primary-700 dark:text-primary-400 font-medium text-sm"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-accent-green animate-pulse" />
      {isDriver ? 'Share your location' : 'Live track driver'}
    </Link>
  );
}
