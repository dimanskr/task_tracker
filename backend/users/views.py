from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import (CreateAPIView, DestroyAPIView,
                                     ListAPIView, RetrieveAPIView,
                                     UpdateAPIView)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status

from users.models import User
from users.permissions import IsModer, IsSelf, IsModerWithRestrictions
from users.serializers import (UserPublicSerializer, UserSerializer,
                             CustomTokenObtainPairSerializer, UserRegisterSerializer,
                             UserUpdateSerializer)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserCreateAPIView(CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = (AllowAny,)

    def perform_create(self, serializer):
        serializer.save()


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
        if (
            self.request.user.is_authenticated
            and self.request.user == self.get_object()
        ):
            return UserSerializer  # Полная информация для владельца
        return UserPublicSerializer  # Общая информация для модераторов


class UserUpdateAPIView(UpdateAPIView):
    serializer_class = UserUpdateSerializer
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
        serializer.save()

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        
        # Создаем новый токен
        token = CustomTokenObtainPairSerializer.get_token(self.request.user)
        
        # Добавляем токен к ответу
        response.data['access'] = str(token.access_token)
        
        return response


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
        IsModerWithRestrictions | IsSelf,
    )

    def perform_destroy(self, instance):
        # Проверяем, не пытается ли пользователь удалить суперпользователя или модератора
        if not self.request.user.is_superuser:  # Если не суперпользователь
            if instance.is_superuser:  # Если пытается удалить суперпользователя
                raise PermissionDenied("Вы не можете удалить суперпользователя")
            if instance.groups.filter(name="moderators").exists():  # Если пытается удалить модератора
                raise PermissionDenied("Вы не можете удалить модератора")
        super().perform_destroy(instance)
