"""
Grade app — stub views returning fixture JSON.
Will be replaced by real grade_image() ML function from Track A.
"""
import json
from pathlib import Path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

FIXTURE = {
    "listing_id": None,
    "grade": "B",
    "confidence": 0.87,
    "defects": [
        {"type": "scratch", "severity": "minor", "location": "top-right", "bbox": [120, 45, 160, 80]}
    ],
    "completeness": 0.95,
    "condition_summary": "Item shows minor scratches on the top surface. All functional components intact.",
    "latency_ms": 1240,
    "model_version": "stub-v0"
}


class GradeView(APIView):
    """POST /api/grade/ — returns stub grade result."""
    permission_classes = [AllowAny]

    def post(self, request):
        response_data = {**FIXTURE, "listing_id": request.data.get("listing_id")}
        return Response(response_data)
