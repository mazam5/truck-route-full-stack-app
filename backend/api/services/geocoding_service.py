import math
import logging
import requests
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Preloaded US freight hub & corridor cities with exact coordinates
US_CITIES_DB = {
    # Major Metros & Logistics Centers
    "chicago, il": {"name": "Chicago, IL", "lat": 41.8781, "lng": -87.6298, "state": "IL"},
    "indianapolis, in": {"name": "Indianapolis, IN", "lat": 39.7684, "lng": -86.1581, "state": "IN"},
    "dallas, tx": {"name": "Dallas, TX", "lat": 32.7767, "lng": -96.7970, "state": "TX"},
    "fort worth, tx": {"name": "Fort Worth, TX", "lat": 32.7555, "lng": -97.3308, "state": "TX"},
    "los angeles, ca": {"name": "Los Angeles, CA", "lat": 34.0522, "lng": -118.2437, "state": "CA"},
    "san francisco, ca": {"name": "San Francisco, CA", "lat": 37.7749, "lng": -122.4194, "state": "CA"},
    "seattle, wa": {"name": "Seattle, WA", "lat": 47.6062, "lng": -122.3321, "state": "WA"},
    "atlanta, ga": {"name": "Atlanta, GA", "lat": 33.7490, "lng": -84.3880, "state": "GA"},
    "miami, fl": {"name": "Miami, FL", "lat": 25.7617, "lng": -80.1918, "state": "FL"},
    "orlando, fl": {"name": "Orlando, FL", "lat": 28.5383, "lng": -81.3792, "state": "FL"},
    "new york, ny": {"name": "New York, NY", "lat": 40.7128, "lng": -74.0060, "state": "NY"},
    "newark, nj": {"name": "Newark, NJ", "lat": 40.7357, "lng": -74.1724, "state": "NJ"},
    "philadelphia, pa": {"name": "Philadelphia, PA", "lat": 39.9526, "lng": -75.1652, "state": "PA"},
    "baltimore, md": {"name": "Baltimore, MD", "lat": 39.2904, "lng": -76.6122, "state": "MD"},
    "richmond, va": {"name": "Richmond, VA", "lat": 37.5407, "lng": -77.4360, "state": "VA"},
    "houston, tx": {"name": "Houston, TX", "lat": 29.7604, "lng": -95.3698, "state": "TX"},
    "san antonio, tx": {"name": "San Antonio, TX", "lat": 29.4241, "lng": -98.4936, "state": "TX"},
    "phoenix, az": {"name": "Phoenix, AZ", "lat": 33.4484, "lng": -112.0740, "state": "AZ"},
    "denver, co": {"name": "Denver, CO", "lat": 39.7392, "lng": -104.9903, "state": "CO"},
    "kansas city, mo": {"name": "Kansas City, MO", "lat": 39.0997, "lng": -94.5786, "state": "MO"},
    "st. louis, mo": {"name": "St. Louis, MO", "lat": 38.6270, "lng": -90.1994, "state": "MO"},
    "memphis, tn": {"name": "Memphis, TN", "lat": 35.1495, "lng": -90.0490, "state": "TN"},
    "nashville, tn": {"name": "Nashville, TN", "lat": 36.1627, "lng": -86.7816, "state": "TN"},
    "columbus, oh": {"name": "Columbus, OH", "lat": 39.9612, "lng": -82.9988, "state": "OH"},
    "cleveland, oh": {"name": "Cleveland, OH", "lat": 41.4993, "lng": -81.6944, "state": "OH"},
    "cincinnati, oh": {"name": "Cincinnati, OH", "lat": 39.1031, "lng": -84.5120, "state": "OH"},
    "detroit, mi": {"name": "Detroit, MI", "lat": 42.3314, "lng": -83.0458, "state": "MI"},
    "minneapolis, mn": {"name": "Minneapolis, MN", "lat": 44.9778, "lng": -93.2650, "state": "MN"},
    "charlotte, nc": {"name": "Charlotte, NC", "lat": 35.2271, "lng": -80.8431, "state": "NC"},
    "raleigh, nc": {"name": "Raleigh, NC", "lat": 35.7796, "lng": -78.6382, "state": "NC"},
    "tampa, fl": {"name": "Tampa, FL", "lat": 27.9506, "lng": -82.4572, "state": "FL"},
    "jacksonville, fl": {"name": "Jacksonville, FL", "lat": 30.3322, "lng": -81.6557, "state": "FL"},
    "pittsburgh, pa": {"name": "Pittsburgh, PA", "lat": 40.4406, "lng": -79.9959, "state": "PA"},
    "boston, ma": {"name": "Boston, MA", "lat": 42.3601, "lng": -71.0589, "state": "MA"},
    "las vegas, nv": {"name": "Las Vegas, NV", "lat": 36.1699, "lng": -115.1398, "state": "NV"},
    "salt lake city, ut": {"name": "Salt Lake City, UT", "lat": 40.7608, "lng": -111.8910, "state": "UT"},
    "albuquerque, nm": {"name": "Albuquerque, NM", "lat": 35.0844, "lng": -106.6504, "state": "NM"},
    "el paso, tx": {"name": "El Paso, TX", "lat": 31.7619, "lng": -106.4850, "state": "TX"},
    "oklahoma city, ok": {"name": "Oklahoma City, OK", "lat": 35.4676, "lng": -97.5164, "state": "OK"},
    "tulsa, ok": {"name": "Tulsa, OK", "lat": 36.1540, "lng": -95.9928, "state": "OK"},
    "omaha, ne": {"name": "Omaha, NE", "lat": 41.2565, "lng": -95.9345, "state": "NE"},
    "des moines, ia": {"name": "Des Moines, IA", "lat": 41.5868, "lng": -93.6250, "state": "IA"},
    "milwaukee, wi": {"name": "Milwaukee, WI", "lat": 43.0389, "lng": -87.9065, "state": "WI"},
    "louisville, ky": {"name": "Louisville, KY", "lat": 38.2527, "lng": -85.7585, "state": "KY"},
    "birmingham, al": {"name": "Birmingham, AL", "lat": 33.5186, "lng": -86.8104, "state": "AL"},
    "new orleans, la": {"name": "New Orleans, LA", "lat": 29.9511, "lng": -90.0715, "state": "LA"},
    "little rock, ar": {"name": "Little Rock, AR", "lat": 34.7465, "lng": -92.2896, "state": "AR"},
    "portland, or": {"name": "Portland, OR", "lat": 45.5152, "lng": -122.6784, "state": "OR"},
    "boise, id": {"name": "Boise, ID", "lat": 43.6150, "lng": -116.2023, "state": "ID"},
    "sacramento, ca": {"name": "Sacramento, CA", "lat": 38.5816, "lng": -121.4944, "state": "CA"},
    
    # Key Intermediate Highway Corridor Truck Stop Towns & Junctions
    "fredericksburg, va": {"name": "Fredericksburg, VA", "lat": 38.3032, "lng": -77.4605, "state": "VA"},
    "cherry hill, nj": {"name": "Cherry Hill, NJ", "lat": 39.9348, "lng": -75.0307, "state": "NJ"},
    "effingham, il": {"name": "Effingham, IL", "lat": 39.1200, "lng": -88.5434, "state": "IL"},
    "mount vernon, il": {"name": "Mt. Vernon, IL", "lat": 38.3173, "lng": -88.9031, "state": "IL"},
    "texarkana, tx": {"name": "Texarkana, TX", "lat": 33.4251, "lng": -94.0477, "state": "TX"},
    "shreveport, la": {"name": "Shreveport, LA", "lat": 32.5252, "lng": -93.7502, "state": "LA"},
    "amarillo, tx": {"name": "Amarillo, TX", "lat": 35.2220, "lng": -101.8313, "state": "TX"},
    "tucumcari, nm": {"name": "Tucumcari, NM", "lat": 35.1717, "lng": -103.7250, "state": "NM"},
    "gallup, nm": {"name": "Gallup, NM", "lat": 35.5281, "lng": -108.7426, "state": "NM"},
    "flagstaff, az": {"name": "Flagstaff, AZ", "lat": 35.1983, "lng": -111.6513, "state": "AZ"},
    "barstow, ca": {"name": "Barstow, CA", "lat": 34.8958, "lng": -117.0173, "state": "CA"},
    "bakersfield, ca": {"name": "Bakersfield, CA", "lat": 35.3733, "lng": -119.0187, "state": "CA"},
    "north platte, ne": {"name": "North Platte, NE", "lat": 41.1239, "lng": -100.7654, "state": "NE"},
    "cheyenne, wy": {"name": "Cheyenne, WY", "lat": 41.1400, "lng": -104.8202, "state": "WY"},
    "rock springs, wy": {"name": "Rock Springs, WY", "lat": 41.5875, "lng": -109.2029, "state": "WY"},
    "elko, nv": {"name": "Elko, NV", "lat": 40.8324, "lng": -115.7631, "state": "NV"},
    "reno, nv": {"name": "Reno, NV", "lat": 39.5296, "lng": -119.8138, "state": "NV"},
    "knoxville, tn": {"name": "Knoxville, TN", "lat": 35.9606, "lng": -83.9207, "state": "TN"},
    "chattanooga, tn": {"name": "Chattanooga, TN", "lat": 35.0456, "lng": -85.3097, "state": "TN"},
    "roanoke, va": {"name": "Roanoke, VA", "lat": 37.2710, "lng": -79.9414, "state": "VA"},
    "wytheville, va": {"name": "Wytheville, VA", "lat": 36.9485, "lng": -81.0848, "state": "VA"},
    "macon, ga": {"name": "Macon, GA", "lat": 32.8407, "lng": -83.6324, "state": "GA"},
    "valdosta, ga": {"name": "Valdosta, GA", "lat": 30.8327, "lng": -83.2785, "state": "GA"},
    "florence, sc": {"name": "Florence, SC", "lat": 34.1954, "lng": -79.7626, "state": "SC"},
    "mobile, al": {"name": "Mobile, AL", "lat": 30.6954, "lng": -88.0399, "state": "AL"},
    "jackson, ms": {"name": "Jackson, MS", "lat": 32.2988, "lng": -90.1848, "state": "MS"},
    "meridian, ms": {"name": "Meridian, MS", "lat": 32.3643, "lng": -88.7037, "state": "MS"},
    "monroe, la": {"name": "Monroe, LA", "lat": 32.5093, "lng": -92.1193, "state": "LA"},
    "springfield, mo": {"name": "Springfield, MO", "lat": 37.2090, "lng": -93.2923, "state": "MO"},
    "joplin, mo": {"name": "Joplin, MO", "lat": 37.0842, "lng": -94.5133, "state": "MO"},
    "salina, ks": {"name": "Salina, KS", "lat": 38.8403, "lng": -97.6114, "state": "KS"},
    "wichita, ks": {"name": "Wichita, KS", "lat": 37.6872, "lng": -97.3301, "state": "KS"},
    "colby, ks": {"name": "Colby, KS", "lat": 39.3958, "lng": -101.0524, "state": "KS"},
    "twin falls, id": {"name": "Twin Falls, ID", "lat": 42.5628, "lng": -114.4609, "state": "ID"},
    "pendleton, or": {"name": "Pendleton, OR", "lat": 45.6721, "lng": -118.7886, "state": "OR"},
    "spokane, wa": {"name": "Spokane, WA", "lat": 47.6588, "lng": -117.4260, "state": "WA"},
    "billings, mt": {"name": "Billings, MT", "lat": 45.7833, "lng": -108.5007, "state": "MT"},
    "bismarck, nd": {"name": "Bismarck, ND", "lat": 46.8083, "lng": -100.7837, "state": "ND"},
    "fargo, nd": {"name": "Fargo, ND", "lat": 46.8772, "lng": -96.7898, "state": "ND"},
    "sioux falls, sd": {"name": "Sioux Falls, SD", "lat": 43.5460, "lng": -96.7313, "state": "SD"},
}

_GEOCODE_CACHE: Dict[str, Dict[str, Any]] = {}


def haversine_distance_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance in miles between two lat/lon points."""
    r = 3958.8  # Earth radius in miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def find_nearest_city(lat: float, lng: float) -> Dict[str, Any]:
    """Find the closest known city/logistics hub for any coordinate."""
    closest_city = None
    min_dist = float("inf")
    for city_key, data in US_CITIES_DB.items():
        d = haversine_distance_miles(lat, lng, data["lat"], data["lng"])
        if d < min_dist:
            min_dist = d
            closest_city = data
    if closest_city:
        return {
            "name": closest_city["name"],
            "lat": lat,
            "lng": lng,
            "distance_to_city_center_miles": round(min_dist, 1),
            "state": closest_city.get("state", "US"),
        }
    return {"name": f"{lat:.3f}, {lng:.3f}", "lat": lat, "lng": lng, "state": "US"}


def geocode_location(query: str) -> Dict[str, Any]:
    """
    Geocode a location string into {name, lat, lng, state}.
    Checks local US cities cache first, then calls OSM Nominatim / Photon with fallback.
    """
    cleaned = query.strip().lower()
    if cleaned in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[cleaned]

    # Check exact/partial match in local DB
    for key, city_data in US_CITIES_DB.items():
        if cleaned == key or cleaned == city_data["name"].lower():
            result = {"name": city_data["name"], "lat": city_data["lat"], "lng": city_data["lng"], "state": city_data["state"]}
            _GEOCODE_CACHE[cleaned] = result
            return result

    # Check city without state or contains
    for key, city_data in US_CITIES_DB.items():
        city_base = key.split(",")[0].strip()
        if cleaned == city_base:
            result = {"name": city_data["name"], "lat": city_data["lat"], "lng": city_data["lng"], "state": city_data["state"]}
            _GEOCODE_CACHE[cleaned] = result
            return result

    # External Geocoding query (Nominatim / OpenStreetMap)
    try:
        url = "https://nominatim.openstreetmap.org/search"
        headers = {"User-Agent": "SpotterHOSRoutePlanner/1.0 (freight-logistics-app)"}
        params = {"q": query, "format": "json", "addressdetails": 1, "countrycodes": "us,ca,mx", "limit": 1}
        resp = requests.get(url, params=params, headers=headers, timeout=4.0)
        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                first = data[0]
                lat = float(first["lat"])
                lng = float(first["lon"])
                display_name = first.get("display_name", query)
                addr = first.get("address", {})
                city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or query.split(",")[0]
                state = addr.get("state_code") or addr.get("state") or ""
                formatted_name = f"{city.title()}, {state}" if state else city.title()

                result = {
                    "name": formatted_name,
                    "lat": lat,
                    "lng": lng,
                    "state": state,
                    "display_name": display_name,
                }
                _GEOCODE_CACHE[cleaned] = result
                return result
    except Exception as e:
        logger.warning(f"OSM geocode error for query '{query}': {e}")

    # Fallback to closest known city match or default
    result = {"name": query.title(), "lat": 39.8283, "lng": -98.5795, "state": "US"}
    _GEOCODE_CACHE[cleaned] = result
    return result


def search_places_autocomplete(query: str, limit: int = 6) -> List[Dict[str, Any]]:
    """Autocomplete search for locations."""
    cleaned = query.strip().lower()
    matches = []
    for key, city in US_CITIES_DB.items():
        if cleaned in key or cleaned in city["name"].lower():
            matches.append({
                "name": city["name"],
                "lat": city["lat"],
                "lng": city["lng"],
                "state": city.get("state", "US"),
            })
            if len(matches) >= limit:
                break
    return matches
