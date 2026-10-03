from django.urls import path
from .views import RoutePlanAPIView, GeocodeAutocompleteAPIView, HealthCheckAPIView

urlpatterns = [
    path('route-plan/', RoutePlanAPIView.as_view(), name='route-plan'),
    path('places/search/', GeocodeAutocompleteAPIView.as_view(), name='places-search'),
    path('health/', HealthCheckAPIView.as_view(), name='health-check'),
]
