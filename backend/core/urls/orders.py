from django.urls import path
from core.views import OrderListCreateView

urlpatterns = [
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
]
