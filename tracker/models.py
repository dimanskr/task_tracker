from django.db import models

from users.models import User

NULLABLE = {"null": True, "blank": True}


class Employee(models.Model):
    """Модель сотрудника"""

    user = models.ForeignKey(
        User, **NULLABLE, on_delete=models.CASCADE, verbose_name="Сотрудник"
    )
    full_name = models.CharField(
        max_length=200,
        verbose_name="ФИО",
        help_text="Введите фамилию, имя и отчество",
    )
    position = models.CharField(
        max_length=250,
        **NULLABLE,
        verbose_name="Должность",
        help_text="Укажите должность работника",
    )

    def __str__(self):
        return f"Сотрудник: {self.full_name}, должность: {self.position}"

    class Meta:
        verbose_name = "Сотрудник"
        verbose_name_plural = "Сотрудники"
        ordering = ("full_name",)


class Task(models.Model):
    """Модель задачи"""

    STATUS_CHOICES = [
        ("new", "Новая"),
        ("in_progress", "В работе"),
        ("on_review", "На проверке"),
        ("completed", "Завершена"),
        ("canceled", "Отменена"),
    ]

    title = models.CharField(max_length=128, verbose_name="Название задачи")
    description = models.TextField(**NULLABLE, verbose_name="Описание задачи")
    parent_task = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        **NULLABLE,
        related_name="subtasks",
        verbose_name="Родительская задача",
    )
    executor = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        **NULLABLE,
        related_name="tasks",
        verbose_name="Исполнитель задачи",
    )
    deadline = models.DateTimeField(**NULLABLE, verbose_name="Срок выполнения")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="new", verbose_name="Статус"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    def __str__(self):
        return f"Задача:{self.title}, срок сдачи: {self.deadline}"

    class Meta:
        verbose_name = "Задача"
        verbose_name_plural = "Задачи"
        ordering = ("deadline",)
