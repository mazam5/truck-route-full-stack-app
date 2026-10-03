from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .services.hos_service import HOSSimulationEngine, STATUS_OFF_DUTY, STATUS_SLEEPER_BERTH, STATUS_DRIVING, STATUS_ON_DUTY_NOT_DRIVING
from .services.geocoding_service import geocode_location
from .services.eld_log_service import generate_daily_log_sheets


class HOSTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_short_trip_hos(self):
        """Test short trip within 11 driving hours (Richmond, VA to Newark, NJ ~340 miles)."""
        current_loc = geocode_location("Richmond, VA")
        pickup_loc = geocode_location("Richmond, VA")
        dropoff_loc = geocode_location("Newark, NJ")

        engine = HOSSimulationEngine(
            current_loc=current_loc,
            pickup_loc=pickup_loc,
            dropoff_loc=dropoff_loc,
            leg1_distance_miles=0.0,
            leg2_distance_miles=340.0,
            full_polyline=[[current_loc["lat"], current_loc["lng"]], [dropoff_loc["lat"], dropoff_loc["lng"]]],
            current_cycle_used_hours=10.0,
        )
        res = engine.simulate_trip()

        self.assertGreater(res["summary"]["total_driving_hours"], 0)
        self.assertLessEqual(res["summary"]["total_driving_hours"], 11.0)
        self.assertEqual(len(res["stops"]), 3)  # Origin, Pickup, Dropoff

    def test_long_cross_country_trip_hos(self):
        """Test long cross-country trip (> 2,000 miles) triggers 10h sleeper rests and fuel stops."""
        current_loc = geocode_location("Chicago, IL")
        pickup_loc = geocode_location("Indianapolis, IN")
        dropoff_loc = geocode_location("Los Angeles, CA")

        engine = HOSSimulationEngine(
            current_loc=current_loc,
            pickup_loc=pickup_loc,
            dropoff_loc=dropoff_loc,
            leg1_distance_miles=180.0,
            leg2_distance_miles=2100.0,
            full_polyline=[[current_loc["lat"], current_loc["lng"]], [pickup_loc["lat"], pickup_loc["lng"]], [dropoff_loc["lat"], dropoff_loc["lng"]]],
            current_cycle_used_hours=20.0,
        )
        res = engine.simulate_trip()

        # Should require multiple 10h sleeper rests
        self.assertGreater(res["summary"]["sleeper_rests_count"], 1)
        # Should require fuel stops (> 2,000 miles)
        self.assertGreater(res["summary"]["fuel_stops_count"], 1)

        # Generate ELD logs
        logs = generate_daily_log_sheets(res, {"current_location": "Chicago, IL", "dropoff_location": "Los Angeles, CA"})
        self.assertGreater(len(logs), 2)

        # Verify every 24-hour log adds up to exactly 24.0 hours
        for log in logs:
            total_h = sum(log["hours_summary"][k] for k in ["off_duty", "sleeper_berth", "driving", "on_duty_not_driving"])
            self.assertAlmostEqual(total_h, 24.0, places=1)

    def test_api_route_plan_endpoint(self):
        """Test the POST /api/route-plan/ endpoint."""
        payload = {
            "current_location": "Chicago, IL",
            "pickup_location": "Indianapolis, IN",
            "dropoff_location": "Dallas, TX",
            "current_cycle_used_hours": 15.5,
            "carrier_name": "Spotter Transport",
            "driver_name": "Jane Driver",
        }
        response = self.client.post("/api/route-plan/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("route_geometry", data)
        self.assertIn("stops", data)
        self.assertIn("daily_logs", data)
        self.assertGreater(len(data["daily_logs"]), 0)

    def test_health_check_endpoint(self):
        """Test GET /api/health/."""
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["status"], "healthy")
