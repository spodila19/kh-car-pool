export type RideStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  phone: string | null;
  display_name: string;
  is_driver: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ride {
  id: string;
  driver_id: string;
  from_place: string;
  to_place: string;
  from_lat: number | null;
  from_lng: number | null;
  to_lat: number | null;
  to_lng: number | null;
  departure_time: string;
  seats_available: number;
  status: RideStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string; phone: string | null } | null;
}

export interface RideRequest {
  id: string;
  ride_id: string;
  user_id: string;
  pickup_place: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  status: RequestStatus;
  created_at: string;
  profiles?: { display_name: string; phone: string | null } | null;
}

export interface DriverLocation {
  ride_id: string;
  driver_id: string;
  lat: number;
  lng: number;
  updated_at: string;
}
