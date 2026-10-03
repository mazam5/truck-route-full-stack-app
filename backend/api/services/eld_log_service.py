import math
import logging
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
from .hos_service import (
    STATUS_OFF_DUTY,
    STATUS_SLEEPER_BERTH,
    STATUS_DRIVING,
    STATUS_ON_DUTY_NOT_DRIVING,
    STATUS_NAMES,
)

logger = logging.getLogger(__name__)


def generate_daily_log_sheets(
    simulation_result: Dict[str, Any],
    trip_metadata: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Slices the continuous event stream from HOSSimulationEngine into strict 24-hour calendar day log sheets
    (00:00 midnight to 24:00 midnight) adhering to FMCSA Driver's Daily Log (Form MCS-59).
    """
    events = simulation_result["events"]
    if not events:
        return []

    first_event_start = datetime.fromisoformat(events[0]["start_time"])
    last_event_end = datetime.fromisoformat(events[-1]["end_time"])

    # Determine calendar day range
    start_date = first_event_start.date()
    end_date = last_event_end.date()
    total_days = (end_date - start_date).days + 1

    daily_sheets: List[Dict[str, Any]] = []

    # Historical cumulative on-duty prior to trip start
    initial_cycle_used = float(trip_metadata.get("current_cycle_used_hours", 0.0))
    cumulative_on_duty_rolling = initial_cycle_used

    carrier_name = trip_metadata.get("carrier_name") or "Spotter Logistics Inc."
    carrier_address = trip_metadata.get("carrier_address") or "100 South Wacker Dr, Suite 1200, Chicago, IL 60606"
    home_terminal = trip_metadata.get("home_terminal") or f"{trip_metadata.get('current_location', 'Chicago, IL')} Terminal"
    driver_name = trip_metadata.get("driver_name") or "John E. Doe"
    co_driver_name = trip_metadata.get("co_driver_name") or "None"
    truck_number = trip_metadata.get("truck_number") or "TRK-8841"
    trailer_number = trip_metadata.get("trailer_number") or "TLR-9022"
    shipping_doc_number = trip_metadata.get("shipping_doc_number") or f"BOL-{abs(hash(str(start_date))) % 900000 + 100000}"
    commodity = trip_metadata.get("commodity") or "General Freight / Commercial Goods"
    origin_name = trip_metadata.get("current_location", "Origin")
    destination_name = trip_metadata.get("dropoff_location", "Destination")

    for day_idx in range(total_days):
        current_day_date = start_date + timedelta(days=day_idx)
        day_start_dt = datetime.combine(current_day_date, datetime.min.time())
        day_end_dt = day_start_dt + timedelta(days=1)

        day_segments: List[Dict[str, Any]] = []
        day_driving_miles = 0.0

        # 1. Fill pre-trip time (Midnight 00:00 until first event) as Off Duty on Day 1
        if day_idx == 0 and first_event_start > day_start_dt:
            pre_duration = (first_event_start - day_start_dt).total_seconds() / 3600.0
            day_segments.append({
                "duty_status": STATUS_OFF_DUTY,
                "duty_name": STATUS_NAMES[STATUS_OFF_DUTY],
                "start_hour": 0.0,
                "end_hour": round(pre_duration, 3),
                "duration_hours": round(pre_duration, 3),
                "location": origin_name,
                "activity": "Off Duty (Pre-Trip Rest)",
                "remarks": f"Off duty at home terminal ({origin_name})",
            })

        # 2. Intersect each simulated event with this 24-hour day window
        for event in events:
            ev_start = datetime.fromisoformat(event["start_time"])
            ev_end = datetime.fromisoformat(event["end_time"])

            # Check if event overlaps with [day_start_dt, day_end_dt]
            overlap_start = max(ev_start, day_start_dt)
            overlap_end = min(ev_end, day_end_dt)

            if overlap_end > overlap_start:
                start_hour_in_day = (overlap_start - day_start_dt).total_seconds() / 3600.0
                end_hour_in_day = (overlap_end - day_start_dt).total_seconds() / 3600.0
                seg_duration = round(end_hour_in_day - start_hour_in_day, 3)

                # Prorate miles driven for this day slice if driving
                seg_miles = 0.0
                total_ev_duration = (ev_end - ev_start).total_seconds() / 3600.0
                if total_ev_duration > 0 and event.get("miles_driven", 0) > 0:
                    fraction = seg_duration / total_ev_duration
                    seg_miles = round(event["miles_driven"] * fraction, 2)
                    day_driving_miles += seg_miles

                day_segments.append({
                    "duty_status": event["duty_status"],
                    "duty_name": event["duty_name"],
                    "start_hour": round(start_hour_in_day, 3),
                    "end_hour": round(end_hour_in_day, 3),
                    "duration_hours": seg_duration,
                    "location": event["location"],
                    "coordinates": event.get("coordinates", [0, 0]),
                    "activity": event["activity"],
                    "remarks": event["remarks"],
                    "miles_driven": seg_miles,
                })

        # 3. Fill post-trip time (after last event until midnight 24:00) as Off Duty on final day
        if day_idx == total_days - 1 and last_event_end < day_end_dt:
            post_start_hour = (last_event_end - day_start_dt).total_seconds() / 3600.0
            post_duration = 24.0 - post_start_hour
            day_segments.append({
                "duty_status": STATUS_OFF_DUTY,
                "duty_name": STATUS_NAMES[STATUS_OFF_DUTY],
                "start_hour": round(post_start_hour, 3),
                "end_hour": 24.0,
                "duration_hours": round(post_duration, 3),
                "location": destination_name,
                "activity": "Off Duty (Post-Trip Rest)",
                "remarks": f"Off duty after delivery at {destination_name}",
            })

        # Sort segments by start hour
        day_segments.sort(key=lambda s: s["start_hour"])

        # Guarantee contiguous coverage from 0.0 to 24.0 without gaps
        normalized_segments: List[Dict[str, Any]] = []
        last_h = 0.0
        for seg in day_segments:
            if seg["start_hour"] > last_h + 0.001:
                # Fill gap as Off Duty
                gap_dur = round(seg["start_hour"] - last_h, 3)
                normalized_segments.append({
                    "duty_status": STATUS_OFF_DUTY,
                    "duty_name": STATUS_NAMES[STATUS_OFF_DUTY],
                    "start_hour": round(last_h, 3),
                    "end_hour": round(seg["start_hour"], 3),
                    "duration_hours": gap_dur,
                    "location": seg["location"],
                    "activity": "Off Duty",
                    "remarks": "Off duty rest",
                })
            normalized_segments.append(seg)
            last_h = seg["end_hour"]

        if last_h < 24.0 - 0.001:
            gap_dur = round(24.0 - last_h, 3)
            normalized_segments.append({
                "duty_status": STATUS_OFF_DUTY,
                "duty_name": STATUS_NAMES[STATUS_OFF_DUTY],
                "start_hour": round(last_h, 3),
                "end_hour": 24.0,
                "duration_hours": gap_dur,
                "location": destination_name,
                "activity": "Off Duty",
                "remarks": "Off duty rest",
            })

        # Tally duty status totals for this 24-hour day
        off_duty_total = round(sum(s["duration_hours"] for s in normalized_segments if s["duty_status"] == STATUS_OFF_DUTY), 2)
        sleeper_total = round(sum(s["duration_hours"] for s in normalized_segments if s["duty_status"] == STATUS_SLEEPER_BERTH), 2)
        driving_total = round(sum(s["duration_hours"] for s in normalized_segments if s["duty_status"] == STATUS_DRIVING), 2)
        on_duty_total = round(sum(s["duration_hours"] for s in normalized_segments if s["duty_status"] == STATUS_ON_DUTY_NOT_DRIVING), 2)

        # Micro adjustment so the 4 lines add up to exactly 24.00
        sum_hours = round(off_duty_total + sleeper_total + driving_total + on_duty_total, 2)
        diff = round(24.00 - sum_hours, 2)
        if abs(diff) > 0.001:
            off_duty_total = round(off_duty_total + diff, 2)

        # Duty today (Driving + On Duty Not Driving)
        duty_hours_today = round(driving_total + on_duty_total, 2)
        cumulative_on_duty_rolling = round(cumulative_on_duty_rolling + duty_hours_today, 2)
        hours_available_tomorrow = round(max(0.0, 70.0 - cumulative_on_duty_rolling), 2)

        # Remarks list with timestamp and location changes
        remarks_list = []
        for s in normalized_segments:
            h_int = int(s["start_hour"])
            m_int = int(round((s["start_hour"] - h_int) * 60))
            time_str = f"{h_int:02d}:{m_int:02d}"
            remarks_list.append({
                "time": time_str,
                "hour_fraction": s["start_hour"],
                "duty_status": s["duty_status"],
                "duty_name": s["duty_name"],
                "location": s["location"],
                "activity": s["activity"],
                "remark_text": s["remarks"],
            })

        sheet = {
            "day_number": day_idx + 1,
            "total_days": total_days,
            "date_formatted": current_day_date.strftime("%m/%d/%Y"),
            "date_iso": current_day_date.isoformat(),
            "month": current_day_date.strftime("%m"),
            "day": current_day_date.strftime("%d"),
            "year": current_day_date.strftime("%Y"),
            "total_miles_driving_today": round(day_driving_miles, 1),
            "total_mileage_today": round(day_driving_miles, 1),
            "carrier_name": carrier_name,
            "carrier_address": carrier_address,
            "home_terminal": home_terminal,
            "driver_name": driver_name,
            "co_driver_name": co_driver_name,
            "truck_number": truck_number,
            "trailer_number": trailer_number,
            "shipping_doc_number": shipping_doc_number,
            "commodity": commodity,
            "from_location": origin_name,
            "to_location": destination_name,
            "segments": normalized_segments,
            "remarks": remarks_list,
            "hours_summary": {
                "off_duty": off_duty_total,
                "sleeper_berth": sleeper_total,
                "driving": driving_total,
                "on_duty_not_driving": on_duty_total,
                "total_hours": 24.0,
            },
            "recap": {
                "on_duty_hours_today": duty_hours_today,
                "total_hours_last_7_days_including_today": min(70.0, cumulative_on_duty_rolling),
                "total_hours_available_tomorrow": hours_available_tomorrow,
                "total_hours_last_8_days_including_today": min(70.0, cumulative_on_duty_rolling),
            },
        }

        daily_sheets.append(sheet)

    return daily_sheets
