from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.generics import (CreateAPIView, DestroyAPIView,
                                     ListAPIView, RetrieveAPIView,
                                     UpdateAPIView)
from rest_framework.permissions import AllowAny, IsAuthenticated

from tracker.models import Employee, Task
from tracker.paginators import CustomPagination
from tracker.serializers import (EmployeeSerializer, EmployeeTasksSerializer,
                                 ImportantTaskSerializer, TaskSerializer)
from users.permissions import IsModer, IsOwner


class EmployeeViewSet(viewsets.ModelViewSet):
    """ViewSet для сотрудников"""

    serializer_class = EmployeeSerializer
    queryset = Employee.objects.all()

    def get_permissions(self):
        """
        Права доступа к эндпоинтам работников
        """
        if self.action in ["create", "destroy"]:
            self.permission_classes = (
                IsAuthenticated,
                IsModer,
            )
        elif self.action in ["update", "retrieve", "partial_update"]:
            self.permission_classes = (
                IsAuthenticated,
                IsModer | IsOwner,
            )
        elif self.action == "list":
            self.permission_classes = (AllowAny,)
        return super().get_permissions()


class TaskListAPIView(ListAPIView):
    """View просмотра списка всех задач"""

    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    pagination_class = CustomPagination
    permission_classes = (AllowAny,)


class TaskRetrieveAPIView(RetrieveAPIView):
    """View просмотра задачи"""

    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    permission_classes = (AllowAny,)


class TaskCreateAPIView(CreateAPIView):
    """View создания задачи"""

    serializer_class = TaskSerializer
    permission_classes = (IsAuthenticated, IsModer)


class TaskUpdateAPIView(UpdateAPIView):
    """View изменения задачи"""

    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    permission_classes = (IsAuthenticated, IsModer)


class TaskDeleteAPIView(DestroyAPIView):
    """View удаления задачи"""

    queryset = Task.objects.all()
    permission_classes = (IsAuthenticated, IsModer)


class EmployeeTasksAPIView(ListAPIView):
    """View для вывода списка сотрудников в порядке убывания количества активных задач"""

    serializer_class = EmployeeTasksSerializer
    permission_classes = (AllowAny,)

    # queryset сотрудников отсортированный по количеству активных задач
    def get_queryset(self):
        return Employee.objects.annotate(
            active_task_count=Count("tasks", filter=Q(tasks__status="in_progress"))
        ).order_by("-active_task_count")


class ImportantTasksAPIView(ListAPIView):
    """View для вывода списка важных задач с сотрудниками для их выполнения"""

    serializer_class = ImportantTaskSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        """
        Метод для получения всех задач с фильтрацией
        :returns: Задачи:
        Со статусом "new"
        - У которых есть родительская задача
        - Родительская задача или её подзадачи в статусе "in_progress"
        """
        return (
            Task.objects.filter(
                status="new",
                parent_task__isnull=False,
            )
            .filter(
                Q(parent_task__status="in_progress")
                | Q(parent_task__subtasks__status="in_progress")
            )
            .distinct()
        )
