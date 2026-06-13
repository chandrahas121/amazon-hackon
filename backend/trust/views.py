"""Trust app — stub Health Card view."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

FIXTURE_CARD = {
    "gs1_uri": "https://id.gs1.org/01/09506000134352/21/abc123",
    "grade": "B",
    "defects": [{"type": "scratch", "severity": "minor"}],
    "owners": ["Amazon Returns", "End Customer"],
    "model_version": "stub-v0",
    "signature": "sha256:abc123def456",
    "ledger_valid": True,
    "overall_score": 87,
    "device_history": ["Single Owner", "Smoke-free environment", "Regularly serviced"],
}


class HealthCardView(APIView):
    """GET /api/card/<listing_id>/"""
    permission_classes = [AllowAny]

    def get(self, request, listing_id):
        return Response({**FIXTURE_CARD, "listing_id": listing_id})
