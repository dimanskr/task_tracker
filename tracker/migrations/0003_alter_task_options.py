# Generated by Django 5.1.4 on 2025-01-16 18:58

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("tracker", "0002_alter_task_status"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="task",
            options={
                "ordering": ("-deadline",),
                "verbose_name": "Задача",
                "verbose_name_plural": "Задачи",
            },
        ),
    ]
