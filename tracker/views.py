from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.generics import (CreateAPIView, DestroyAPIView,
                                     ListAPIView, RetrieveAPIView,
                                     UpdateAPIView)
from rest_framework.permissions import AllowAny, IsAuthenticated

from tracker.models import Employee, Task, Position
from tracker.paginators import CustomPagination
from tracker.serializers import (EmployeeSerializer, EmployeeTasksSerializer,
                                 ImportantTaskSerializer, TaskSerializer, PositionSerializer)
from users.permissions import IsModer, IsEmployeeOwner


class PositionViewSet(viewsets.ModelViewSet):
    """ViewSet для позиций"""

    serializer_class = PositionSerializer
    queryset = Position.objects.all()

    def get_permissions(self):
        """
        Права доступа к эндпоинтам позиций
        """
        if self.action in ["create", "update", "partial_update", "destroy"]:
            self.permission_classes = (IsAuthenticated, IsModer)
        else:
            self.permission_classes = (AllowAny,)
        return super().get_permissions()


class EmployeeViewSet(viewsets.ModelViewSet):
    """ViewSet для сотрудников"""

    serializer_class = EmployeeSerializer
    queryset = Employee.objects.all()

    def get_permissions(self):
        """
        Права доступа к эндпоинтам работников
        """
        if self.action in ["destroy"]:
            self.permission_classes = (
                IsAuthenticated,
                IsModer,
            )
        elif self.action in ["create", "update", "partial_update"]:
            self.permission_classes = (
                IsAuthenticated,
                IsModer | IsEmployeeOwner,
            )
        else:  # list и retrieve
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
        Метод для получения всех задач с фильтрацией:
        - Со статусом "new"
        - У которых есть родительская задача
        - Родительская задача или её подзадачи в статусе "in_progress"
        - Есть сотрудники с хотя бы одной из требуемых специализаций
        """
        # Получаем базовый queryset задач
        tasks = (
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

        # Фильтруем задачи, для которых есть подходящие сотрудники
        filtered_tasks = []
        for task in tasks:
            required_positions = task.required_positions.all()
            if not required_positions.exists():
                filtered_tasks.append(task)
                continue

            # Ищем сотрудников с любой из требуемых специализаций
            matching_employees = Employee.objects.filter(
                positions__in=required_positions
            ).distinct()
            
            if matching_employees.exists():
                filtered_tasks.append(task)

        return filtered_tasks
