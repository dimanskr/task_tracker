from django.db import models

from users.models import User

NULLABLE = {"null": True, "blank": True}


class Position(models.Model):
    """Модель специализации/должности"""
    
    name = models.CharField(max_length=150, verbose_name="Название специализации")
    description = models.TextField(**NULLABLE, verbose_name="Описание специализации")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Специализация"
        verbose_name_plural = "Специализации"
        ordering = ("name",)


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
    positions = models.ManyToManyField(
        Position,
        related_name="employees",
        verbose_name="Специализации",
        help_text="Выберите одну или несколько специализаций сотрудника"
    )

    def __str__(self):
        return f"Сотрудник: {self.full_name}"

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
    required_positions = models.ManyToManyField(
        Position,
        related_name="tasks",
        verbose_name="Требуемые специализации",
        help_text="Выберите необходимые специализации для выполнения задачи"
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
        ordering = ("-deadline",)
