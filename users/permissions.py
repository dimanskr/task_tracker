from rest_framework import permissions


class IsModer(permissions.BasePermission):
    """Проверяет, является ли пользователь модератором или суперпользователем."""

    def has_permission(self, request, view):
        return (
            request.user.is_superuser  # Суперпользователь
            or request.user.groups.filter(name="moderators").exists()  # Модератор
        )


class IsModerWithRestrictions(permissions.BasePermission):
    """
    Разрешение для модераторов с ограничениями:
    - Модератор не может удалять суперпользователей
    - Модератор не может удалять других модераторов
    - Суперпользователь может удалять любых пользователей
    """

    def has_permission(self, request, view):
        return (
            request.user.is_superuser  # Суперпользователь
            or request.user.groups.filter(name="moderators").exists()  # Модератор
        )

    def has_object_permission(self, request, view, obj):
        # Суперпользователь может делать все
        if request.user.is_superuser:
            return True
            
        # Для модераторов проверяем ограничения
        if request.user.groups.filter(name="moderators").exists():
            # Нельзя удалять суперпользователей
            if obj.is_superuser:
                return False
            # Нельзя удалять других модераторов
            if obj.groups.filter(name="moderators").exists():
                return False
            return True
            
        return False


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
