from tracker.models import Employee, Task
from rest_framework import serializers


class EmployeeSerializer(serializers.ModelSerializer):
    """Сериализатор сотрудника"""

    class Meta:
        model = Employee
        fields = "__all__"


class TaskSerializer(serializers.ModelSerializer):
    """Сериализатор задачи"""

    class Meta:
        model = Task
        fields = "__all__"