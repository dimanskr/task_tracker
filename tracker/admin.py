from django.contrib import admin

from tracker.models import Employee, Task


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "position", "user__email")
    list_filter = (
        "full_name",
        "position",
    )
    search_fields = (
        "full_name",
        "position",
    )


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "description",
        "parent_task__title",
        "executor__full_name",
        "status",
        "deadline",
        "created_at",
        "updated_at",
    )
    list_filter = ("title", "status", "deadline")
    search_fields = (
        "title",
        "status",
    )
