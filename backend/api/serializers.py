from rest_framework import serializers


class RoutePlanRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(
        required=True,
        allow_blank=False,
        help_text="Starting origin / driver's current location (e.g. 'Chicago, IL')",
    )
    pickup_location = serializers.CharField(
        required=True,
        allow_blank=False,
        help_text="Shipper / Pickup location (e.g. 'Indianapolis, IN')",
    )
    dropoff_location = serializers.CharField(
        required=True,
        allow_blank=False,
        help_text="Receiver / Dropoff delivery location (e.g. 'Dallas, TX')",
    )
    current_cycle_used_hours = serializers.FloatField(
        required=False,
        default=0.0,
        min_value=0.0,
        max_value=70.0,
        help_text="Hours already used in current 70-hour / 8-day rolling cycle (default: 0.0)",
    )
    start_time = serializers.DateTimeField(
        required=False,
        allow_null=True,
        help_text="Trip start date/time (default: current or scheduled morning time)",
    )
    carrier_name = serializers.CharField(
        required=False,
        default="Spotter Logistics Inc.",
        allow_blank=True,
    )
    driver_name = serializers.CharField(
        required=False,
        default="John E. Doe",
        allow_blank=True,
    )
    truck_number = serializers.CharField(
        required=False,
        default="TRK-8841",
        allow_blank=True,
    )
    trailer_number = serializers.CharField(
        required=False,
        default="TLR-9022",
        allow_blank=True,
    )
    commodity = serializers.CharField(
        required=False,
        default="General Freight / Palletized Goods",
        allow_blank=True,
    )
    shipping_doc_number = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class PlaceSearchSerializer(serializers.Serializer):
    query = serializers.CharField(
        required=True,
        allow_blank=False,
        help_text="City or place search query",
    )
