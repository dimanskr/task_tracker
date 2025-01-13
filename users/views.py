from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import (CreateAPIView, DestroyAPIView,
                                     ListAPIView, RetrieveAPIView,
                                     UpdateAPIView)
from rest_framework.permissions import AllowAny, IsAuthenticated

from users.models import User
from users.permissions import IsModer, IsSelf
from users.serializers import UserPublicSerializer, UserSerializer


class UserCreateAPIView(CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = (AllowAny,)

    def perform_create(self, serializer):
        user = serializer.save(is_active=True)
        user.set_password(user.password)
        user.save()


class UserRetrieveAPIView(RetrieveAPIView):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    permission_classes = (
        IsAuthenticated,
        IsModer | IsSelf,
    )

    def get_serializer_class(self):
        """
        Выбираем сериализатор в зависимости от владельца.
        """
        if self.request.user == self.get_object():
            return UserSerializer  # Полная информация для владельца
        return UserPublicSerializer  # Общая информация для модераторов


class UserUpdateAPIView(UpdateAPIView):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    permission_classes = (
        IsAuthenticated,
        IsSelf,
    )

    def perform_update(self, serializer):
        # Разрешаем редактирование только владельцу профиля
        if self.request.user != self.get_object():
            raise PermissionDenied("Вы можете редактировать только свой профиль.")
        # Сохраняем обновленные данные пользователя
        user = serializer.save()

        # Хэшируем пароль, если он передан
        if "password" in serializer.validated_data:
            user.set_password(serializer.validated_data["password"])
            user.save()


class UserListAPIView(ListAPIView):
    serializer_class = UserPublicSerializer
    queryset = User.objects.all()
    permission_classes = (
        IsAuthenticated,
        IsModer,
    )


class UserDestroyAPIView(DestroyAPIView):
    queryset = User.objects.all()
    permission_classes = (
        IsAuthenticated,
        IsModer | IsSelf,
    )
