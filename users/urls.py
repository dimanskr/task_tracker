from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import (TokenObtainPairView,
                                            TokenRefreshView)

from users.apps import UsersConfig
from users.views import (UserCreateAPIView, UserDestroyAPIView,
                         UserListAPIView, UserRetrieveAPIView,
                         UserUpdateAPIView)

app_name = UsersConfig.name

urlpatterns = [
    path("register/", UserCreateAPIView.as_view(), name="user-register"),
    path(
        "login/",
        TokenObtainPairView.as_view(permission_classes=(AllowAny,)),
        name="login",
    ),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(permission_classes=(AllowAny,)),
        name="token-refresh",
    ),
    path("", UserListAPIView.as_view(), name="user-list"),
    path("<int:pk>/", UserRetrieveAPIView.as_view(), name="user-retrieve"),
    path("update/<int:pk>/", UserUpdateAPIView.as_view(), name="user-update"),
    path("delete/<int:pk>/", UserDestroyAPIView.as_view(), name="user-delete"),
]
