from django.urls import path
from .views import CreditsView
urlpatterns = [path('<int:user_id>/', CreditsView.as_view(), name='credits')]
