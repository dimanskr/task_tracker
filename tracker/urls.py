from tracker.apps import TrackerConfig
from django.urls import path
from rest_framework.routers import SimpleRouter
from tracker.views import EmployeeViewSet, TaskListAPIView, TaskRetrieveAPIView, TaskCreateAPIView, TaskUpdateAPIView, \
    TaskDeleteAPIView

app_name = TrackerConfig.name

router = SimpleRouter()
router.register(r'employees', EmployeeViewSet, basename='employees')

urlpatterns = [
    path('task-list/', TaskListAPIView.as_view(), name='task-list'),
    path('task/<int:pk>/', TaskRetrieveAPIView.as_view(), name='task-retrieve'),
    path('task/create/', TaskCreateAPIView.as_view(), name='task-create'),
    path('task/update/<int:pk>/', TaskUpdateAPIView.as_view(), name='task-update'),
    path('task/delete/<int:pk>/', TaskDeleteAPIView.as_view(), name='task-delete'),
]

urlpatterns += router.urls