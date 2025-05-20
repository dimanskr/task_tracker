from django.db.models import Count, Q
from rest_framework import serializers

from tracker.models import Employee, Task, Position
from tracker.validators import (validate_deadline_not_in_past,
                                validate_deadline_with_parent,
                                validate_status_on_creation)


class PositionSerializer(serializers.ModelSerializer):
    """Сериализатор специализации"""

    class Meta:
        model = Position
        fields = "__all__"


class EmployeeSerializer(serializers.ModelSerializer):
    """Сериализатор сотрудника"""
    positions = PositionSerializer(many=True, read_only=True)
    positions_ids = serializers.PrimaryKeyRelatedField(
        source='positions',
        queryset=Position.objects.all(),
        write_only=True,
        many=True,
        required=False
    )
    user_email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    tg_chat_id = serializers.SerializerMethodField()

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def get_phone(self, obj):
        try:
            return str(obj.user.phone) if obj.user and obj.user.phone else None
        except:
            return None

    def get_tg_chat_id(self, obj):
        try:
            return obj.user.tg_chat_id if obj.user else None
        except:
            return None

    class Meta:
        model = Employee
        fields = ("id", "user", "user_email", "full_name", "positions", "positions_ids", "phone", "tg_chat_id")
        extra_kwargs = {
            'user': {'required': False, 'write_only': True}  # Делаем поле user опциональным и только для записи
        }

    def create(self, validated_data):
        positions = validated_data.pop('positions', [])
        employee = Employee.objects.create(**validated_data)
        if positions:
            employee.positions.set(positions)
        return employee

    def update(self, instance, validated_data):
        positions = validated_data.pop('positions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if positions is not None:
            instance.positions.set(positions)
        instance.save()
        return instance


class TaskSerializer(serializers.ModelSerializer):
    """Сериализатор задачи"""

    executor = EmployeeSerializer(read_only=True)
    executor_id = serializers.PrimaryKeyRelatedField(
        source='executor',
        queryset=Employee.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    required_positions = PositionSerializer(many=True, read_only=True)
    required_positions_ids = serializers.PrimaryKeyRelatedField(
        source='required_positions',
        queryset=Position.objects.all(),
        write_only=True,
        many=True,
        required=False
    )

    class Meta:
        model = Task
        fields = (
            "id", "title", "description", "parent_task", "executor", "executor_id",
            "required_positions", "required_positions_ids", "deadline", "status",
            "created_at", "updated_at"
        )

    def validate(self, data):
        """
        Выполняет общую валидацию данных модели.
        """
        validate_deadline_not_in_past(data)
        validate_deadline_with_parent(data)
        validate_status_on_creation(self, data)
        return data

    def create(self, validated_data):
        required_positions = validated_data.pop('required_positions', [])
        task = Task.objects.create(**validated_data)
        if required_positions:
            task.required_positions.set(required_positions)
        return task

    def update(self, instance, validated_data):
        required_positions = validated_data.pop('required_positions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if required_positions is not None:
            instance.required_positions.set(required_positions)
        instance.save()
        return instance


class EmployeeTasksSerializer(serializers.ModelSerializer):
    """Сериализатор сотрудника с его задачами и количеством выполняемых задач"""

    active_task_count = serializers.SerializerMethodField()
    tasks = TaskSerializer(many=True)
    positions = PositionSerializer(many=True, read_only=True)

    @staticmethod
    def get_active_task_count(obj):
        return obj.tasks.filter(status="in_progress").count()

    class Meta:
        model = Employee
        fields = ("id", "full_name", "positions", "active_task_count", "tasks")


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
        - Сотрудники должны иметь хотя бы одну из требуемых специализаций для задачи
        """
        # Получаем требуемые специализации для задачи
        required_positions = task.required_positions.all()

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
            # Проверяем, имеет ли сотрудник хотя бы одну из требуемых специализаций
            employee_positions = set(employee.positions.all())
            required_positions_set = set(required_positions)
            
            if not employee_positions.intersection(required_positions_set):
                continue

            if employee.active_task_count == min_task_count or (
                task.parent_task
                and task.parent_task.executor == employee
                and employee.active_task_count <= min_task_count + 2
            ):
                potential_executors.append(employee.full_name)

        return potential_executors if potential_executors else ["Нет подходящих сотрудников"]
