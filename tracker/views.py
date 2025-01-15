from rest_framework import viewsets
from rest_framework.generics import (CreateAPIView, DestroyAPIView,
                                     ListAPIView, RetrieveAPIView,
                                     UpdateAPIView)
from rest_framework.permissions import AllowAny, IsAuthenticated

from tracker.models import Employee, Task
from tracker.paginators import CustomPagination
from tracker.serializers import EmployeeSerializer, TaskSerializer
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
