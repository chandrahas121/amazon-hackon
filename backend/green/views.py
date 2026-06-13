"""Green credits app — stub balance view."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny


class CreditsView(APIView):
    """GET /api/credits/<user_id>/"""
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        return Response({
            "user_id": user_id,
            "balance": 220,
            "pending": 45,
            "history": [
                {"event": "Order delivered", "amount": 80, "status": "vested", "date": "2024-05-15"},
                {"event": "Return avoided", "amount": 140, "status": "vested", "date": "2024-04-22"},
                {"event": "Current order", "amount": 45, "status": "pending", "date": "2024-06-01"},
            ]
        })
