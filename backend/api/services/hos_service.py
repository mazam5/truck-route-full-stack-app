import math
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
from .geocoding_service import find_nearest_city
from .routing_service import find_coordinate_at_distance

logger = logging.getLogger(__name__)

# Duty Status Constants corresponding to standard DOT ELD Form MCS-59
STATUS_OFF_DUTY = 1
STATUS_SLEEPER_BERTH = 2
STATUS_DRIVING = 3
STATUS_ON_DUTY_NOT_DRIVING = 4

STATUS_NAMES = {
    STATUS_OFF_DUTY: "Off Duty",
    STATUS_SLEEPER_BERTH: "Sleeper Berth",
    STATUS_DRIVING: "Driving",
    STATUS_ON_DUTY_NOT_DRIVING: "On Duty (Not Driving)",
}


class HOSSimulationEngine:
    """
    Simulates a commercial property-carrying truck trip according to FMCSA regulations (49 CFR Part 395).
    Rules Enforced:
    - 70-Hour / 8-Day limit (with optional 34-hour restart if exhausted)
    - 11-Hour maximum driving limit per shift
    - 14-Hour consecutive on-duty driving window
    - 30-Minute mandatory rest break after 8 hours of cumulative driving
    - 10-Hour consecutive sleeper berth / rest to reset 11h/14h shift clocks
    - Fueling stop (30 min on-duty) at least once every 1,000 miles
    - 1.0 Hour on-duty loading at pickup
    - 1.0 Hour on-duty unloading at dropoff
    """

    def __init__(
        self,
        current_loc: Dict[str, Any],
        pickup_loc: Dict[str, Any],
        dropoff_loc: Dict[str, Any],
        leg1_distance_miles: float,
        leg2_distance_miles: float,
        full_polyline: List[List[float]],
        current_cycle_used_hours: float = 0.0,
        start_datetime: Optional[datetime] = None,
        average_speed_mph: float = 58.0,
    ):
        self.current_loc = current_loc
        self.pickup_loc = pickup_loc
        self.dropoff_loc = dropoff_loc
        self.leg1_distance = leg1_distance_miles
        self.leg2_distance = leg2_distance_miles
        self.total_distance = round(leg1_distance_miles + leg2_distance_miles, 2)
        self.full_polyline = full_polyline
        self.average_speed_mph = max(35.0, min(average_speed_mph, 70.0))

        # Initial clocks
        self.current_time = start_datetime or datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
        self.cycle_used_hours = float(current_cycle_used_hours)
        
        # Shift Clocks (Assuming driver had 10h rest before start_datetime)
        self.shift_drive_hours = 0.0      # max 11.0
        self.shift_duty_window_hours = 0.0 # max 14.0 (elapsed time since shift start)
        self.drive_since_break_hours = 0.0 # max 8.0
        self.miles_since_last_fuel = 0.0   # max 1000.0
        self.cumulative_miles_traveled = 0.0

        self.events: List[Dict[str, Any]] = []
        self.stops: List[Dict[str, Any]] = []

    def _get_current_location_name_and_coords(self) -> Tuple[str, List[float]]:
        """Get the geographical position based on cumulative miles traveled along polyline."""
        if self.cumulative_miles_traveled <= 0.1:
            return self.current_loc["name"], [self.current_loc["lat"], self.current_loc["lng"]]
        if self.cumulative_miles_traveled >= self.total_distance - 0.5:
            return self.dropoff_loc["name"], [self.dropoff_loc["lat"], self.dropoff_loc["lng"]]
        if abs(self.cumulative_miles_traveled - self.leg1_distance) < 2.0:
            return self.pickup_loc["name"], [self.pickup_loc["lat"], self.pickup_loc["lng"]]

        coords = find_coordinate_at_distance(self.full_polyline, self.cumulative_miles_traveled, self.total_distance)
        nearest = find_nearest_city(coords[0], coords[1])
        return nearest["name"], coords

    def _record_event(
        self,
        duty_status: int,
        duration_hours: float,
        activity_title: str,
        remarks: str,
        miles_covered: float = 0.0,
        stop_type: Optional[str] = None,
    ):
        """Records a discrete time event in the driver's log."""
        if duration_hours <= 0:
            return

        loc_name, coords = self._get_current_location_name_and_coords()
        start_t = self.current_time
        end_t = start_t + timedelta(hours=duration_hours)

        event = {
            "duty_status": duty_status,
            "duty_name": STATUS_NAMES[duty_status],
            "start_time": start_t.isoformat(),
            "end_time": end_t.isoformat(),
            "duration_hours": round(duration_hours, 3),
            "location": loc_name,
            "coordinates": coords,
            "activity": activity_title,
            "remarks": remarks,
            "miles_driven": round(miles_covered, 2),
            "cumulative_miles": round(self.cumulative_miles_traveled, 2),
        }
        self.events.append(event)

        if stop_type:
            stop_info = {
                "stop_type": stop_type,
                "title": activity_title,
                "location": loc_name,
                "coordinates": coords,
                "arrival_time": start_t.isoformat(),
                "departure_time": end_t.isoformat(),
                "duration_hours": round(duration_hours, 2),
                "duration_minutes": int(round(duration_hours * 60)),
                "cumulative_miles": round(self.cumulative_miles_traveled, 1),
                "remarks": remarks,
                "duty_status": STATUS_NAMES[duty_status],
            }
            self.stops.append(stop_info)

        # Update clocks
        self.current_time = end_t
        if duty_status in (STATUS_DRIVING, STATUS_ON_DUTY_NOT_DRIVING):
            self.cycle_used_hours += duration_hours
            self.shift_duty_window_hours += duration_hours
        else:
            # Off duty or Sleeper Berth still advances the elapsed 14-hour window clock
            self.shift_duty_window_hours += duration_hours

    def _take_30_min_break(self, reason: str = "Mandatory 30-Min HOS Rest Break"):
        """Takes a 30-minute rest break (Off Duty / Rest)."""
        duration = 0.5
        self._record_event(
            duty_status=STATUS_OFF_DUTY,
            duration_hours=duration,
            activity_title="30-Min Rest Break",
            remarks=f"30-min break at {self._get_current_location_name_and_coords()[0]} ({reason})",
            stop_type="REST_BREAK",
        )
        self.drive_since_break_hours = 0.0

    def _take_10_hr_sleeper_rest(self, reason: str = "10-Hour Mandatory Daily Rest"):
        """Takes a 10-hour consecutive rest in Sleeper Berth to reset daily 11h drive and 14h window clocks."""
        duration = 10.0
        self._record_event(
            duty_status=STATUS_SLEEPER_BERTH,
            duration_hours=duration,
            activity_title="10-Hour Sleeper Berth Rest",
            remarks=f"10-hr rest in Sleeper Berth at {self._get_current_location_name_and_coords()[0]}",
            stop_type="SLEEPER_REST",
        )
        # Reset shift clocks
        self.shift_drive_hours = 0.0
        self.shift_duty_window_hours = 0.0
        self.drive_since_break_hours = 0.0

    def _take_34_hr_restart(self, reason: str = "34-Hour Weekly Cycle Reset (70-Hr Limit Reached)"):
        """Takes a 34-hour restart to reset 70-hour / 8-day cycle back to zero."""
        duration = 34.0
        self._record_event(
            duty_status=STATUS_OFF_DUTY,
            duration_hours=duration,
            activity_title="34-Hour Cycle Restart",
            remarks=f"34-hr restart at {self._get_current_location_name_and_coords()[0]} ({reason})",
            stop_type="CYCLE_RESTART",
        )
        # Reset cycle & shift clocks
        self.cycle_used_hours = 0.0
        self.shift_drive_hours = 0.0
        self.shift_duty_window_hours = 0.0
        self.drive_since_break_hours = 0.0

    def _take_fuel_stop(self):
        """Takes a 30-minute fueling stop (On Duty Not Driving). Also satisfies 30-min break requirement."""
        duration = 0.5
        self._record_event(
            duty_status=STATUS_ON_DUTY_NOT_DRIVING,
            duration_hours=duration,
            activity_title="Fueling & Inspection",
            remarks=f"Fuel truck and visual inspection at {self._get_current_location_name_and_coords()[0]}",
            stop_type="FUEL_STOP",
        )
        self.miles_since_last_fuel = 0.0
        # Fueling stop is 30 min on-duty, which under 2020 HOS rules satisfies the 30-min break
        self.drive_since_break_hours = 0.0

    def _drive_segment(self, target_miles: float, leg_name: str):
        """
        Drives `target_miles`, intelligently chunking driving to respect:
        - 11-hour drive limit
        - 14-hour duty window limit
        - 8-hour driving 30-min break requirement
        - 1,000-mile fuel stop requirement
        - 70-hour cycle limit
        """
        remaining_miles_in_leg = target_miles

        while remaining_miles_in_leg > 0.1:
            # Check 70-hour cycle limit
            if self.cycle_used_hours >= 69.5:
                self._take_34_hr_restart("70-hour cycle limit reached")
                continue

            # Check if 11-hour driving or 14-hour window reached
            if self.shift_drive_hours >= 11.0 or self.shift_duty_window_hours >= 14.0:
                self._take_10_hr_sleeper_rest("11-hr drive limit or 14-hr window reached")
                continue

            # Check if 30-min break is required (after 8h cumulative drive)
            if self.drive_since_break_hours >= 8.0:
                self._take_30_min_break("8 hours cumulative driving reached")
                continue

            # Check if fueling is due (every 1,000 miles)
            if self.miles_since_last_fuel >= 1000.0:
                self._take_fuel_stop()
                continue

            # Calculate how much driving we can do in the next chunk
            max_drive_hours_by_11h = 11.0 - self.shift_drive_hours
            max_drive_hours_by_14h = 14.0 - self.shift_duty_window_hours
            max_drive_hours_by_8h_break = 8.0 - self.drive_since_break_hours
            max_drive_hours_by_cycle = 70.0 - self.cycle_used_hours
            max_drive_hours_by_fuel = (1000.0 - self.miles_since_last_fuel) / self.average_speed_mph
            drive_hours_for_remaining_leg = remaining_miles_in_leg / self.average_speed_mph

            # Determine limiting factor
            allowed_drive_hours = min(
                drive_hours_for_remaining_leg,
                max_drive_hours_by_11h,
                max_drive_hours_by_14h,
                max_drive_hours_by_8h_break,
                max_drive_hours_by_cycle,
                max_drive_hours_by_fuel,
            )

            # Safeguard small chunks
            if allowed_drive_hours <= 0.01:
                if max_drive_hours_by_fuel <= 0.01:
                    self._take_fuel_stop()
                elif max_drive_hours_by_8h_break <= 0.01:
                    self._take_30_min_break()
                elif max_drive_hours_by_11h <= 0.01 or max_drive_hours_by_14h <= 0.01:
                    self._take_10_hr_sleeper_rest()
                elif max_drive_hours_by_cycle <= 0.01:
                    self._take_34_hr_restart()
                continue

            # Drive this chunk
            chunk_miles = min(remaining_miles_in_leg, allowed_drive_hours * self.average_speed_mph)
            actual_drive_hours = chunk_miles / self.average_speed_mph

            self.cumulative_miles_traveled += chunk_miles
            self.miles_since_last_fuel += chunk_miles
            self.shift_drive_hours += actual_drive_hours
            self.drive_since_break_hours += actual_drive_hours

            loc_name, _ = self._get_current_location_name_and_coords()
            self._record_event(
                duty_status=STATUS_DRIVING,
                duration_hours=actual_drive_hours,
                activity_title=f"Driving ({leg_name})",
                remarks=f"En route to {loc_name} ({round(chunk_miles, 1)} mi)",
                miles_covered=chunk_miles,
            )

            remaining_miles_in_leg -= chunk_miles

    def simulate_trip(self) -> Dict[str, Any]:
        """
        Executes full trip workflow:
        1. Pre-trip inspection (0.25h on-duty)
        2. Leg 1: Deadhead driving to Pickup
        3. Pickup: 1.0h loading at Shipper
        4. Leg 2: Loaded driving to Dropoff with all HOS stops
        5. Dropoff: 1.0h unloading at Consignee
        6. Post-trip inspection (0.25h on-duty)
        7. Off-duty rest at destination
        """
        trip_start_time = self.current_time

        # Initial Stop Marker: Origin / Starting Point
        self.stops.append({
            "stop_type": "ORIGIN",
            "title": "Trip Origin (Current Location)",
            "location": self.current_loc["name"],
            "coordinates": [self.current_loc["lat"], self.current_loc["lng"]],
            "arrival_time": self.current_time.isoformat(),
            "departure_time": self.current_time.isoformat(),
            "duration_hours": 0.0,
            "duration_minutes": 0,
            "cumulative_miles": 0.0,
            "remarks": "Reported for work at origin",
            "duty_status": "Off Duty",
        })

        # 1. Pre-Trip Inspection (0.25h on-duty)
        self._record_event(
            duty_status=STATUS_ON_DUTY_NOT_DRIVING,
            duration_hours=0.25,
            activity_title="Pre-Trip Inspection",
            remarks=f"Pre-trip inspection & log audit at {self.current_loc['name']}",
        )

        # 2. Leg 1: Drive to Pickup (if distance > 0)
        if self.leg1_distance > 0.5:
            self._drive_segment(self.leg1_distance, "Leg 1: To Pickup")

        # 3. Pickup Stop: 1.0 hr On-Duty Loading at Shipper
        self._record_event(
            duty_status=STATUS_ON_DUTY_NOT_DRIVING,
            duration_hours=1.0,
            activity_title="Pickup (Loading Cargo)",
            remarks=f"Loading freight & bill of lading at {self.pickup_loc['name']}",
            stop_type="PICKUP",
        )

        # 4. Leg 2: Drive to Dropoff
        self._drive_segment(self.leg2_distance, "Leg 2: To Dropoff")

        # 5. Dropoff Stop: 1.0 hr On-Duty Unloading at Consignee
        self._record_event(
            duty_status=STATUS_ON_DUTY_NOT_DRIVING,
            duration_hours=1.0,
            activity_title="Dropoff (Unloading Cargo)",
            remarks=f"Unloading freight & delivery signature at {self.dropoff_loc['name']}",
            stop_type="DROPOFF",
        )

        # 6. Post-Trip Inspection & Wrap-up (0.25h on-duty)
        self._record_event(
            duty_status=STATUS_ON_DUTY_NOT_DRIVING,
            duration_hours=0.25,
            activity_title="Post-Trip Inspection",
            remarks=f"Post-trip inspection, DVIR, and paperwork completed at {self.dropoff_loc['name']}",
        )

        trip_end_time = self.current_time
        total_trip_duration_hours = (trip_end_time - trip_start_time).total_seconds() / 3600.0

        # Tally total duty hours
        totals = {
            "off_duty_hours": sum(e["duration_hours"] for e in self.events if e["duty_status"] == STATUS_OFF_DUTY),
            "sleeper_berth_hours": sum(e["duration_hours"] for e in self.events if e["duty_status"] == STATUS_SLEEPER_BERTH),
            "driving_hours": sum(e["duration_hours"] for e in self.events if e["duty_status"] == STATUS_DRIVING),
            "on_duty_not_driving_hours": sum(e["duration_hours"] for e in self.events if e["duty_status"] == STATUS_ON_DUTY_NOT_DRIVING),
        }
        total_on_duty = totals["driving_hours"] + totals["on_duty_not_driving_hours"]

        return {
            "summary": {
                "total_distance_miles": self.total_distance,
                "total_trip_duration_hours": round(total_trip_duration_hours, 2),
                "total_driving_hours": round(totals["driving_hours"], 2),
                "total_on_duty_hours": round(total_on_duty, 2),
                "total_sleeper_hours": round(totals["sleeper_berth_hours"], 2),
                "total_off_duty_hours": round(totals["off_duty_hours"], 2),
                "final_cycle_used_hours": round(self.cycle_used_hours, 2),
                "cycle_hours_remaining": round(max(0.0, 70.0 - self.cycle_used_hours), 2),
                "trip_start_time": trip_start_time.isoformat(),
                "trip_end_time": trip_end_time.isoformat(),
                "fuel_stops_count": len([s for s in self.stops if s["stop_type"] == "FUEL_STOP"]),
                "rest_breaks_count": len([s for s in self.stops if s["stop_type"] == "REST_BREAK"]),
                "sleeper_rests_count": len([s for s in self.stops if s["stop_type"] == "SLEEPER_REST"]),
            },
            "events": self.events,
            "stops": self.stops,
        }
