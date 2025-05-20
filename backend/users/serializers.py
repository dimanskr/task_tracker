from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from users.models import User
from tracker.models import Employee, Position


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Получаем токен для текущего пользователя
        token = self.get_token(self.user)
        
        # Добавляем дополнительные данные в ответ
        data['user_id'] = self.user.id
        data['is_moderator'] = self.user.groups.filter(name="moderators").exists()
        data['is_superuser'] = self.user.is_superuser
        
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Добавляем группы пользователя в токен
        token['groups'] = [group.name for group in user.groups.all()]
        
        # Добавляем информацию о суперпользователе
        token['is_superuser'] = user.is_superuser
        
        return token


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
            "is_superuser",
        )


class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Сериализатор для регистрации пользователя с созданием сотрудника
    """
    full_name = serializers.CharField(write_only=True)
    positions_ids = serializers.PrimaryKeyRelatedField(
        queryset=Position.objects.all(),
        many=True,
        write_only=True
    )

    class Meta:
        model = User
        fields = (
            "email",
            "password",
            "phone",
            "city",
            "full_name",
            "positions_ids",
        )

    def create(self, validated_data):
        positions = validated_data.pop('positions_ids')
        full_name = validated_data.pop('full_name')
        
        # Создаем пользователя
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        # Создаем сотрудника и привязываем к нему пользователя
        employee = Employee.objects.create(
            user=user,  # Здесь привязываем пользователя
            full_name=full_name
        )
        
        # Добавляем специализации
        employee.positions.set(positions)
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для обновления пользователя без пароля
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
