from django.urls import path
from rest_framework.routers import SimpleRouter

from tracker.apps import TrackerConfig
from tracker.views import (EmployeeTasksAPIView, EmployeeViewSet,
                           ImportantTasksAPIView, TaskCreateAPIView,
                           TaskDeleteAPIView, TaskListAPIView,
                           TaskRetrieveAPIView, TaskUpdateAPIView)

app_name = TrackerConfig.name

router = SimpleRouter()
router.register(r"employees", EmployeeViewSet, basename="employees")

urlpatterns = [
    path("task-list/", TaskListAPIView.as_view(), name="task-list"),
    path("task/<int:pk>/", TaskRetrieveAPIView.as_view(), name="task-retrieve"),
    path("task/create/", TaskCreateAPIView.as_view(), name="task-create"),
    path("task/update/<int:pk>/", TaskUpdateAPIView.as_view(), name="task-update"),
    path("task/delete/<int:pk>/", TaskDeleteAPIView.as_view(), name="task-delete"),
    path(
        "employees-tasks/", EmployeeTasksAPIView.as_view(), name="employee-tasks-list"
    ),
    path(
        "important-tasks/", ImportantTasksAPIView.as_view(), name="important-tasks-list"
    ),
]

urlpatterns += router.urls
