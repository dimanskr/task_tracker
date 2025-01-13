# Generated by Django 5.1.4 on 2025-01-13 10:32

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Employee",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "full_name",
                    models.CharField(
                        help_text="Введите фамилию, имя и отчество",
                        max_length=200,
                        verbose_name="ФИО",
                    ),
                ),
                (
                    "position",
                    models.CharField(
                        blank=True,
                        help_text="Укажите должность работника",
                        max_length=250,
                        null=True,
                        verbose_name="Должность",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Сотрудник",
                    ),
                ),
            ],
            options={
                "verbose_name": "Сотрудник",
                "verbose_name_plural": "Сотрудники",
                "ordering": ("full_name",),
            },
        ),
        migrations.CreateModel(
            name="Task",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "title",
                    models.CharField(max_length=128, verbose_name="Название задачи"),
                ),
                (
                    "description",
                    models.TextField(
                        blank=True, null=True, verbose_name="Описание задачи"
                    ),
                ),
                (
                    "deadline",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Срок выполнения"
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("new", "Новая"),
                            ("in_progress", "В работе"),
                            ("completed", "Завершена"),
                            ("canceled", "Отменена"),
                        ],
                        max_length=20,
                        verbose_name="Статус",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True, verbose_name="Дата создания"
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="Дата обновления"),
                ),
                (
                    "executor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="tasks",
                        to="tracker.employee",
                        verbose_name="Исполнитель задачи",
                    ),
                ),
                (
                    "parent_task",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="subtasks",
                        to="tracker.task",
                        verbose_name="Родительская задача",
                    ),
                ),
            ],
            options={
                "verbose_name": "Задача",
                "verbose_name_plural": "Задачи",
                "ordering": ("deadline",),
            },
        ),
    ]
