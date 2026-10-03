import logging
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import RoutePlanRequestSerializer, PlaceSearchSerializer
from .services.geocoding_service import geocode_location, search_places_autocomplete
from .services.routing_service import (
    get_complete_trip_route,
    calculate_fallback_route,
    get_osrm_route,
)
from .services.hos_service import HOSSimulationEngine
from .services.eld_log_service import generate_daily_log_sheets

logger = logging.getLogger(__name__)


class RoutePlanAPIView(APIView):
    """
    POST /api/route-plan/
    Calculates truck route, optimal HOS stop schedule, and generates 24-hour FMCSA daily log sheets.
    """

    def post(self, request, *args, **kwargs):
        serializer = RoutePlanRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Validation Error", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated = serializer.validated_data
        current_loc_str = validated["current_location"]
        pickup_loc_str = validated["pickup_location"]
        dropoff_loc_str = validated["dropoff_location"]
        cycle_used = float(validated.get("current_cycle_used_hours", 0.0))
        start_time = validated.get("start_time")

        # 1. Geocode the three key locations
        current_geo = geocode_location(current_loc_str)
        pickup_geo = geocode_location(pickup_loc_str)
        dropoff_geo = geocode_location(dropoff_loc_str)

        # 2. Compute Routing (Leg 1: Current -> Pickup, Leg 2: Pickup -> Dropoff)
        leg1_route = get_osrm_route([(current_geo["lat"], current_geo["lng"]), (pickup_geo["lat"], pickup_geo["lng"])])
        if not leg1_route or len(leg1_route.get("coordinates", [])) < 2:
            leg1_route = calculate_fallback_route(current_geo, pickup_geo)

        leg2_route = get_osrm_route([(pickup_geo["lat"], pickup_geo["lng"]), (dropoff_geo["lat"], dropoff_geo["lng"])])
        if not leg2_route or len(leg2_route.get("coordinates", [])) < 2:
            leg2_route = calculate_fallback_route(pickup_geo, dropoff_geo)

        leg1_distance = leg1_route["distance_miles"]
        leg2_distance = leg2_route["distance_miles"]
        total_distance = round(leg1_distance + leg2_distance, 2)

        # Merge polyline coordinates
        merged_polyline = leg1_route["coordinates"] + leg2_route["coordinates"][1:]

        # 3. Simulate HOS Schedule (49 CFR § 395)
        engine = HOSSimulationEngine(
            current_loc=current_geo,
            pickup_loc=pickup_geo,
            dropoff_loc=dropoff_geo,
            leg1_distance_miles=leg1_distance,
            leg2_distance_miles=leg2_distance,
            full_polyline=merged_polyline,
            current_cycle_used_hours=cycle_used,
            start_datetime=start_time,
            average_speed_mph=58.0,
        )
        sim_result = engine.simulate_trip()

        # 4. Generate 24-Hour FMCSA Driver's Daily Log Sheets (Form MCS-59)
        trip_metadata = {
            "current_location": current_geo["name"],
            "pickup_location": pickup_geo["name"],
            "dropoff_location": dropoff_geo["name"],
            "current_cycle_used_hours": cycle_used,
            "carrier_name": validated.get("carrier_name"),
            "driver_name": validated.get("driver_name"),
            "truck_number": validated.get("truck_number"),
            "trailer_number": validated.get("trailer_number"),
            "commodity": validated.get("commodity"),
            "shipping_doc_number": validated.get("shipping_doc_number"),
        }
        daily_sheets = generate_daily_log_sheets(sim_result, trip_metadata)

        # 5. Build Unified JSON Response
        response_data = {
            "status": "success",
            "trip_info": {
                "origin": current_geo,
                "pickup": pickup_geo,
                "dropoff": dropoff_geo,
                "leg1_distance_miles": leg1_distance,
                "leg2_distance_miles": leg2_distance,
                "total_distance_miles": total_distance,
                "initial_cycle_used_hours": cycle_used,
                "start_time": sim_result["summary"]["trip_start_time"],
                "estimated_completion_time": sim_result["summary"]["trip_end_time"],
            },
            "route_geometry": {
                "type": "LineString",
                "coordinates": merged_polyline,
            },
            "summary": sim_result["summary"],
            "stops": sim_result["stops"],
            "timeline_events": sim_result["events"],
            "daily_logs": daily_sheets,
        }

        return Response(response_data, status=status.HTTP_200_OK)


class GeocodeAutocompleteAPIView(APIView):
    """
    GET /api/places/search/?q=Chicago
    Autocomplete endpoint for US cities and freight hubs.
    """

    def get(self, request, *args, **kwargs):
        query = request.query_params.get("q", "")
        if not query or len(query.strip()) < 2:
            return Response([], status=status.HTTP_200_OK)

        suggestions = search_places_autocomplete(query, limit=8)
        return Response(suggestions, status=status.HTTP_200_OK)


class HealthCheckAPIView(APIView):
    """
    GET /api/health/
    Health and readiness check.
    """

    def get(self, request, *args, **kwargs):
        return Response(
            {
                "status": "healthy",
                "service": "Spotter Truck Route & HOS Engine API",
                "version": "1.0.0",
                "timestamp": datetime.now().isoformat(),
            },
            status=status.HTTP_200_OK,
        )
