from django.urls import path
from .views import HealthCardView

urlpatterns = [
    path('<int:listing_id>/', HealthCardView.as_view(), name='health-card'),
]
