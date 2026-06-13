from django.urls import path
from .views import RiskView
urlpatterns = [path('risk/', RiskView.as_view(), name='risk')]
