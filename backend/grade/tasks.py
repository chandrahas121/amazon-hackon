import base64
import logging

from celery import shared_task
from django.core.cache import cache

logger = logging.getLogger(__name__)

_FALLBACK = {
    "grade": "B",
    "confidence": 0.75,
    "defects": [],
    "completeness": 0.9,
    "condition_summary": "Item appears to be in good condition. Manual review recommended.",
    "functional": True,
    "latency_ms": 0,
    "model_version": "fallback-v0",
    "from_cache": False,
}


@shared_task(bind=True, max_retries=2, soft_time_limit=120)
def grade_image_task(self, image_b64: str, product_id: str, category: str, operator: str, job_id: str):
    """
    Celery task that runs the ML grading pipeline in a separate worker process.

    Flow:
      AsyncGradeView (Django)  →  Redis queue  →  this task (Celery worker)
                                                         ↓
                                              result stored in Redis
                                                         ↓
                              GradeStatusView polls until status == "done"

    Retries up to 2 times (5-second delay each) before falling back to grade B.
    Image bytes are base64-encoded for JSON-safe transport through the queue.
    """
    image_bytes = base64.b64decode(image_b64)
    try:
        from ml.grade import grade_image
        result = grade_image(
            image_bytes=image_bytes,
            product_id=product_id,
            operator=operator,
            category=category,
            use_cache=True,
        )
        result['status'] = 'done'
        result['job_id'] = job_id
    except Exception as exc:
        if self.request.retries < self.max_retries:
            logger.warning(f"[grade_image_task] retry {self.request.retries + 1}: {exc}")
            raise self.retry(exc=exc, countdown=5)
        logger.error(f"[grade_image_task] all retries exhausted, using fallback: {exc}")
        result = {**_FALLBACK, 'status': 'done', 'job_id': job_id, 'error': str(exc)}

    cache.set(f'grade_job:{job_id}', result, 3600)
    return job_id
