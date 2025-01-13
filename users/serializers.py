from rest_framework import serializers

from users.models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Сериализатор с общей информацией о пользователе
    """

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "password",
            "phone",
            "city",
            "avatar",
            "tg_chat_id",
        )


class UserPublicSerializer(serializers.ModelSerializer):
    """
    Сериализатор с информацией без пароля
    """

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "phone",
            "city",
            "avatar",
            "tg_chat_id",
        )
