from rest_framework import permissions


class IsModer(permissions.BasePermission):
    """Проверяет, является ли пользователь модератором или суперпользователем."""

    def has_permission(self, request, view):
        return (
            request.user.is_superuser  # Суперпользователь
            or request.user.groups.filter(name="moderators").exists()  # Модератор
        )


class IsSelf(permissions.BasePermission):
    """Разрешение, которое позволяет пользователю просматривать только свой профиль."""

    def has_object_permission(self, request, view, obj):
        # Проверяем, является ли объект пользователя текущим пользователем
        return obj == request.user


class IsOwner(permissions.BasePermission):
    """Проверяет, является ли пользователь владельцем."""

    def has_object_permission(self, request, view, obj):
        if obj.user == request.user:
            return True
        return False
