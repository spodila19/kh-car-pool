'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DriverLocation } from '@/lib/types';

const DEFAULT_CENTER: [number, number] = [17.385, 78.4867];
const DEFAULT_ZOOM = 12;

// CartoDB Voyager - free, no API key, often more reliable than OSM tiles
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

// Fix Leaflet default marker icon (breaks with Next.js/Webpack)
const MARKER_ICON = {
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
};

export default function TrackMap({ rideId, isDriver }: { rideId: string; isDriver: boolean }) {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [mapEl, setMapEl] = useState<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<{ map: any; marker: any } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`driver_location:${rideId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_locations', filter: `ride_id=eq.${rideId}` },
        (payload) => {
          const row = payload.new as DriverLocation;
          if (row) setLocation(row);
        }
      )
      .subscribe();

    supabase.from('driver_locations').select('*').eq('ride_id', rideId).single().then(({ data }) => {
      if (data) setLocation(data as DriverLocation);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, supabase]);

  useEffect(() => {
    if (!mapEl || typeof window === 'undefined') return;
    import('leaflet').then((L) => {
      const map = L.default.map(mapEl).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      const layer = L.default.tileLayer(TILE_URL, { attribution: '© OpenStreetMap © CARTO' });
      layer.addTo(map);
      let marker: ReturnType<typeof L.default.marker> | null = null;
      mapRef.current = { map, marker };
    });
    return () => {
      if (mapRef.current) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  }, [mapEl]);

  useEffect(() => {
    const ref = mapRef.current;
    if (!ref || !location) return;
    import('leaflet').then((L) => {
      const icon = L.default.icon(MARKER_ICON);
      if (!ref.marker) {
        ref.marker = L.default.marker([location.lat, location.lng], { icon })
          .addTo(ref.map)
          .bindPopup(isDriver ? 'Your location' : 'Ride host');
      } else {
        ref.marker.setLatLng([location.lat, location.lng]);
      }
      ref.map.setView([location.lat, location.lng], ref.map.getZoom());
    });
  }, [location, isDriver]);

  return (
    <div
      ref={setMapEl}
      className="w-full h-full min-h-[300px]"
      style={{ minHeight: '60vh' }}
    />
  );
}
