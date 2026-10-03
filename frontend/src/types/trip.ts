export interface GeoLocation {
  name: string;
  lat: number;
  lng: number;
  state?: string;
  display_name?: string;
}

export interface TripInput {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hours: number;
  start_time?: string;
  carrier_name?: string;
  driver_name?: string;
  truck_number?: string;
  trailer_number?: string;
  commodity?: string;
  shipping_doc_number?: string;
}

export interface StopInfo {
  stop_type: "ORIGIN" | "PICKUP" | "DROPOFF" | "FUEL_STOP" | "REST_BREAK" | "SLEEPER_REST" | "CYCLE_RESTART";
  title: string;
  location: string;
  coordinates: [number, number];
  arrival_time: string;
  departure_time: string;
  duration_hours: number;
  duration_minutes: number;
  cumulative_miles: number;
  remarks: string;
  duty_status: string;
}

export interface TimelineEvent {
  duty_status: number; // 1=Off Duty, 2=Sleeper Berth, 3=Driving, 4=On Duty
  duty_name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  location: string;
  coordinates: [number, number];
  activity: string;
  remarks: string;
  miles_driven: number;
  cumulative_miles: number;
}

export interface LogSegment {
  duty_status: number; // 1, 2, 3, 4
  duty_name: string;
  start_hour: number; // 0.0 - 24.0
  end_hour: number;   // 0.0 - 24.0
  duration_hours: number;
  location: string;
  coordinates?: [number, number];
  activity: string;
  remarks: string;
  miles_driven?: number;
}

export interface LogRemark {
  time: string;
  hour_fraction: number;
  duty_status: number;
  duty_name: string;
  location: string;
  activity: string;
  remark_text: string;
}

export interface HoursSummary {
  off_duty: number;
  sleeper_berth: number;
  driving: number;
  on_duty_not_driving: number;
  total_hours: number;
}

export interface RecapInfo {
  on_duty_hours_today: number;
  total_hours_last_7_days_including_today: number;
  total_hours_available_tomorrow: number;
  total_hours_last_8_days_including_today: number;
}

export interface DailyLogSheet {
  day_number: number;
  total_days: number;
  date_formatted: string;
  date_iso: string;
  month: string;
  day: string;
  year: string;
  total_miles_driving_today: number;
  total_mileage_today: number;
  carrier_name: string;
  carrier_address: string;
  home_terminal: string;
  driver_name: string;
  co_driver_name: string;
  truck_number: string;
  trailer_number: string;
  shipping_doc_number: string;
  commodity: string;
  from_location: string;
  to_location: string;
  segments: LogSegment[];
  remarks: LogRemark[];
  hours_summary: HoursSummary;
  recap: RecapInfo;
}

export interface TripSummary {
  total_distance_miles: number;
  total_trip_duration_hours: number;
  total_driving_hours: number;
  total_on_duty_hours: number;
  total_sleeper_hours: number;
  total_off_duty_hours: number;
  final_cycle_used_hours: number;
  cycle_hours_remaining: number;
  trip_start_time: string;
  trip_end_time: string;
  fuel_stops_count: number;
  rest_breaks_count: number;
  sleeper_rests_count: number;
}

export interface TripPlanResponse {
  status: "success" | "error";
  trip_info: {
    origin: GeoLocation;
    pickup: GeoLocation;
    dropoff: GeoLocation;
    leg1_distance_miles: number;
    leg2_distance_miles: number;
    total_distance_miles: number;
    initial_cycle_used_hours: number;
    start_time: string;
    estimated_completion_time: string;
  };
  route_geometry: {
    type: "LineString";
    coordinates: [number, number][]; // [lat, lng]
  };
  summary: TripSummary;
  stops: StopInfo[];
  timeline_events: TimelineEvent[];
  daily_logs: DailyLogSheet[];
}
