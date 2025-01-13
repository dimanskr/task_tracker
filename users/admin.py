from django.contrib import admin

from users.models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "email",
        "phone",
        "city",
        "avatar",
        "tg_chat_id",
        "display_groups",
    )
    exclude = ("password",)
    list_filter = ("is_superuser", "is_active", "groups")
    search_fields = ("email",)
    filter_horizontal = (
        "groups",
        "user_permissions",
    )

    def display_groups(self, obj):
        # Возвращаем список групп пользователя через запятую
        return ", ".join([group.name for group in obj.groups.all()])

    display_groups.short_description = "Группы"  # Настройка названия колонки
