from django.utils import timezone
from rest_framework import serializers


def validate_deadline_not_in_past(value):
    """Дедлайн должен быть больше или равен текущей дате."""
    deadline = value.get("deadline")
    if deadline and deadline < timezone.now():
        raise serializers.ValidationError(
            "Дедлайн должен быть больше или равен текущей дате."
        )


def validate_deadline_with_parent(value):
    """Дедлайн задачи должен быть меньше или равен дедлайну родительской задачи, если указан."""
    deadline = value.get("deadline")
    parent_task = value.get("parent_task")
    if parent_task and deadline and parent_task.deadline:
        if deadline > parent_task.deadline:
            raise serializers.ValidationError(
                "Дедлайн задачи должен быть меньше или равен дедлайну родительской задачи."
            )


def validate_status_on_creation(serializer_instance, value):
    """Статус задачи при создании должен быть допустимым. Если создается новая задача, то у нее нет instance."""
    if not serializer_instance.instance:
        status = value.get("status")
        if status not in ["new", "in_progress"]:
            raise serializers.ValidationError(
                "Задача при создании может иметь только статус 'new' или 'in_progress'."
            )
