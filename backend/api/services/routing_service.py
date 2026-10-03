import math
import logging
import requests
from typing import List, Tuple, Dict, Any, Optional
from .geocoding_service import haversine_distance_miles

logger = logging.getLogger(__name__)

# Free public OSRM server for car/truck highway routing
OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=geojson&steps=true"


def get_osrm_route(coordinates: List[Tuple[float, float]]) -> Optional[Dict[str, Any]]:
    """
    Query OSRM routing API.
    coordinates: List of (lat, lng) tuples.
    Returns {distance_miles, duration_hours, coordinates: [[lat, lng], ...], steps: [...]}
    """
    try:
        # OSRM expects {lng},{lat};{lng},{lat}
        coord_str = ";".join([f"{lng:.6f},{lat:.6f}" for lat, lng in coordinates])
        url = OSRM_ROUTE_URL.format(coords=coord_str)
        headers = {"User-Agent": "SpotterHOSRoutePlanner/1.0"}
        resp = requests.get(url, headers=headers, timeout=6.0)

        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                route = data["routes"][0]
                distance_meters = route["distance"]
                duration_seconds = route["duration"]
                geometry = route.get("geometry", {}).get("coordinates", [])
                # GeoJSON coordinates are [lng, lat], convert to [lat, lng]
                lat_lng_polyline = [[pt[1], pt[0]] for pt in geometry]

                distance_miles = distance_meters * 0.000621371
                duration_hours = duration_seconds / 3600.0

                return {
                    "distance_miles": round(distance_miles, 2),
                    "duration_hours": round(duration_hours, 2),
                    "coordinates": lat_lng_polyline,
                    "legs": route.get("legs", []),
                }
    except Exception as e:
        logger.warning(f"OSRM routing request failed: {e}")

    return None


def generate_fallback_polyline(lat1: float, lng1: float, lat2: float, lng2: float, num_points: int = 50) -> List[List[float]]:
    """Generate intermediate curved waypoint coordinates along a great circle path."""
    polyline = []
    for i in range(num_points + 1):
        fraction = i / float(num_points)
        # Linear interpolation with slight highway corridor arc
        lat = lat1 + fraction * (lat2 - lat1)
        lng = lng1 + fraction * (lng2 - lng1)
        # Add slight natural road curvature
        arc = math.sin(fraction * math.pi) * 0.25 * (1 if (lat1 + lng1) % 2 == 0 else -0.25)
        polyline.append([round(lat + arc, 5), round(lng, 5)])
    return polyline


def calculate_fallback_route(origin: Dict[str, Any], destination: Dict[str, Any]) -> Dict[str, Any]:
    """Compute fallback route using Haversine distance and 1.18x highway road winding factor."""
    straight_miles = haversine_distance_miles(origin["lat"], origin["lng"], destination["lat"], destination["lng"])
    # 1.18 is average US interstate network circuity factor
    road_miles = straight_miles * 1.18
    # Average commercial truck speed ~55 mph
    duration_hours = road_miles / 55.0
    polyline = generate_fallback_polyline(origin["lat"], origin["lng"], destination["lat"], destination["lng"])

    return {
        "distance_miles": round(road_miles, 2),
        "duration_hours": round(duration_hours, 2),
        "coordinates": polyline,
        "is_fallback": True,
    }


def find_coordinate_at_distance(polyline: List[List[float]], target_miles: float, total_miles: float) -> List[float]:
    """Find the interpolated [lat, lng] along polyline at target_miles from start."""
    if not polyline:
        return [0.0, 0.0]
    if target_miles <= 0:
        return polyline[0]
    if target_miles >= total_miles or len(polyline) < 2:
        return polyline[-1]

    # Walk through polyline segments
    accumulated = 0.0
    for i in range(len(polyline) - 1):
        p1 = polyline[i]
        p2 = polyline[i + 1]
        seg_dist = haversine_distance_miles(p1[0], p1[1], p2[0], p2[1])
        if accumulated + seg_dist >= target_miles:
            # Interpolate within this segment
            remainder = target_miles - accumulated
            ratio = (remainder / seg_dist) if seg_dist > 0 else 0.0
            lat = p1[0] + ratio * (p2[0] - p1[0])
            lng = p1[1] + ratio * (p2[1] - p1[1])
            return [round(lat, 5), round(lng, 5)]
        accumulated += seg_dist

    # Fallback to ratio based on total points
    idx = int((target_miles / max(total_miles, 0.001)) * (len(polyline) - 1))
    idx = max(0, min(idx, len(polyline) - 1))
    return polyline[idx]


def get_complete_trip_route(current: Dict[str, Any], pickup: Dict[str, Any], dropoff: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes complete 2-leg trip route:
    Leg 1: Current Location -> Pickup
    Leg 2: Pickup -> Dropoff
    """
    # Try OSRM route for all 3 waypoints
    osrm_res = get_osrm_route([(current["lat"], current["lng"]), (pickup["lat"], pickup["lng"]), (dropoff["lat"], dropoff["lng"])])

    if osrm_res and len(osrm_res.get("coordinates", [])) > 5:
        return {
            "distance_miles": osrm_res["distance_miles"],
            "duration_hours": osrm_res["duration_hours"],
            "coordinates": osrm_res["coordinates"],
            "is_fallback": False,
        }

    # Fallback combining Leg 1 and Leg 2
    leg1 = calculate_fallback_route(current, pickup)
    leg2 = calculate_fallback_route(pickup, dropoff)

    combined_coords = leg1["coordinates"] + leg2["coordinates"][1:]
    total_dist = round(leg1["distance_miles"] + leg2["distance_miles"], 2)
    total_dur = round(leg1["duration_hours"] + leg2["duration_hours"], 2)

    return {
        "distance_miles": total_dist,
        "duration_hours": total_dur,
        "coordinates": combined_coords,
        "is_fallback": True,
    }
