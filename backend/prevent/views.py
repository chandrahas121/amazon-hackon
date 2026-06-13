"""Prevent app — stub risk scoring view."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny


class RiskView(APIView):
    """POST /api/prevent/risk/"""
    permission_classes = [AllowAny]

    def post(self, request):
        return Response({
            "risk": 0.23,
            "flagged_item_id": None,
            "nudge_text": "Great news — low return risk detected. Your Green Credits will vest in 15 days.",
            "credit_promise": 45,
        })
