from django.db.models import Count, Q
from rest_framework import serializers

from tracker.models import Employee, Task
from tracker.validators import (validate_deadline_not_in_past,
                                validate_deadline_with_parent,
                                validate_status_on_creation)


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

    def validate(self, data):
        """
        Выполняет общую валидацию данных модели.
        """
        validate_deadline_not_in_past(data)
        validate_deadline_with_parent(data)
        validate_status_on_creation(self, data)
        return data


class EmployeeTasksSerializer(serializers.ModelSerializer):
    """Сериализатор сотрудника с его задачами и количеством выполняемых задач"""

    active_task_count = serializers.SerializerMethodField()
    tasks = TaskSerializer(many=True)

    @staticmethod
    def get_active_task_count(obj):
        return obj.tasks.filter(status="in_progress").count()

    class Meta:
        model = Employee
        fields = ("full_name", "position", "active_task_count", "tasks")


class ImportantTaskSerializer(serializers.ModelSerializer):
    """Сериализатор для задач с выбором подходящих сотрудников"""

    executors = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ("title", "deadline", "executors")

    @staticmethod
    def get_executors(task):
        """
        Метод для поиска сотрудников, которые могут взять задачу:
        - Сотрудники с минимальным количеством задач в статусе "in_progress"
        - Сотрудник, выполняющий родительскую задачу,
        если у него максимум на 2 задачи больше, чем у наименее загруженного
        """
        # Подсчет задач в статусе "in_progress" у сотрудников
        employees_with_task_counts = Employee.objects.annotate(
            active_task_count=Count("tasks", filter=Q(tasks__status="in_progress"))
        ).order_by("active_task_count")

        if not employees_with_task_counts.exists():
            return ["Нет доступных сотрудников"]

        # Минимальное количество задач в статусе "in_progress"
        min_task_count = employees_with_task_counts.first().active_task_count

        # Формирование списка подходящих сотрудников для выполнения задачи:
        potential_executors = []
        for employee in employees_with_task_counts:
            if employee.active_task_count == min_task_count or (
                task.parent_task
                and task.parent_task.executor == employee
                and employee.active_task_count <= min_task_count + 2
            ):
                potential_executors.append(employee.full_name)

        return potential_executors
