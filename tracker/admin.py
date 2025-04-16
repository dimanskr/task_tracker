from django.contrib import admin

from tracker.models import Employee, Task, Position


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "description")
    list_filter = ("name",)
    search_fields = ("name", "description")


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "get_positions", "user__email")
    list_filter = ("full_name", "positions")
    search_fields = ("full_name",)
    filter_horizontal = ("positions",)

    def get_positions(self, obj):
        return ", ".join([p.name for p in obj.positions.all()])
    get_positions.short_description = "Специализации"


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "description",
        "parent_task__title",
        "executor__full_name",
        "get_required_positions",
        "status",
        "deadline",
        "created_at",
        "updated_at",
    )
    list_filter = ("title", "status", "deadline", "required_positions")
    search_fields = ("title", "status")
    filter_horizontal = ("required_positions",)

    def get_required_positions(self, obj):
        return ", ".join([p.name for p in obj.required_positions.all()])
    get_required_positions.short_description = "Требуемые специализации"
