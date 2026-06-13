from django.urls import path
from .views import GradeView

urlpatterns = [
    path('', GradeView.as_view(), name='grade'),
]
