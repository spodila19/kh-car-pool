'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DriverLocation, RiderLocation } from '@/lib/types';

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

export default function TrackMap({
  rideId,
  isDriver,
  pickupLocation,
}: {
  rideId: string;
  isDriver: boolean;
  pickupLocation?: { lat: number; lng: number } | null;
}) {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [riderLocations, setRiderLocations] = useState<RiderLocation[]>([]);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapEl, setMapEl] = useState<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<{ map: any; marker: any; riderMarkers: Map<string, any>; riderMarker: any; pickupMarker: any } | null>(null);
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
    if (!isDriver) return;
    const channel = supabase
      .channel(`rider_locations:${rideId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rider_locations', filter: `ride_id=eq.${rideId}` },
        () => {
          supabase.from('rider_locations').select('*, profiles(display_name)').eq('ride_id', rideId).then(({ data }) => {
            setRiderLocations((data as RiderLocation[]) ?? []);
          });
        }
      )
      .subscribe();

    supabase.from('rider_locations').select('*, profiles(display_name)').eq('ride_id', rideId).then(({ data }) => {
      setRiderLocations((data as RiderLocation[]) ?? []);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, isDriver, supabase]);

  useEffect(() => {
    if (!mapEl || typeof window === 'undefined') return;
    import('leaflet').then((L) => {
      const map = L.default.map(mapEl).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      const layer = L.default.tileLayer(TILE_URL, { attribution: '© OpenStreetMap © CARTO' });
      layer.addTo(map);
      mapRef.current = { map, marker: null, riderMarkers: new Map(), riderMarker: null, pickupMarker: null };
    });
    return () => {
      if (mapRef.current) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  }, [mapEl]);

  // Rider: get own location for "You" marker
  useEffect(() => {
    if (isDriver) return;
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setRiderLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [isDriver]);

  useEffect(() => {
    const ref = mapRef.current;
    if (!ref) return;
    import('leaflet').then((L) => {
      const icon = L.default.icon(MARKER_ICON);
      if (location) {
        if (!ref.marker) {
          ref.marker = L.default.marker([location.lat, location.lng], { icon })
            .addTo(ref.map)
            .bindPopup(isDriver ? 'Your location' : 'Ride host');
        } else {
          ref.marker.setLatLng([location.lat, location.lng]);
        }
        ref.map.setView([location.lat, location.lng], ref.map.getZoom());
      }
      if (isDriver && riderLocations.length > 0) {
        const riderIcon = L.default.divIcon({
          html: '<div style="background:#059669;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        riderLocations.forEach((rl) => {
          const key = rl.user_id;
          if (!ref.riderMarkers.has(key)) {
            const m = L.default.marker([rl.lat, rl.lng], { icon: riderIcon })
              .addTo(ref.map)
              .bindPopup(rl.profiles?.display_name ?? 'Rider waiting');
            ref.riderMarkers.set(key, m);
          } else {
            ref.riderMarkers.get(key).setLatLng([rl.lat, rl.lng]);
          }
        });
      }
      if (!isDriver && riderLocation) {
        const riderIcon = L.default.divIcon({
          html: '<div style="background:#059669;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        if (!ref.riderMarker) {
          ref.riderMarker = L.default.marker([riderLocation.lat, riderLocation.lng], { icon: riderIcon })
            .addTo(ref.map)
            .bindPopup('You');
        } else {
          ref.riderMarker.setLatLng([riderLocation.lat, riderLocation.lng]);
        }
      }
      if (!isDriver && pickupLocation) {
        const pickupIcon = L.default.divIcon({
          html: '<div style="background:#ea580c;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        if (!ref.pickupMarker) {
          ref.pickupMarker = L.default.marker([pickupLocation.lat, pickupLocation.lng], { icon: pickupIcon })
            .addTo(ref.map)
            .bindPopup('Your pickup');
        }
      }
    });
  }, [location, isDriver, riderLocation, riderLocations, pickupLocation]);

  return (
    <div
      ref={setMapEl}
      className="w-full h-full min-h-[300px]"
      style={{ minHeight: '60vh' }}
    />
  );
}
