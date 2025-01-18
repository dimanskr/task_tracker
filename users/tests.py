from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User


class BaseAPITestCase(APITestCase):
    """
    Базовый тестовый класс для API, предоставляющий общие данные.
    """

    def setUp(self):
        """
        Подготовка общих тестовых данных.
        """
        # Создаем группу модераторов
        self.moder_group = Group.objects.create(name="moderators")

        # Создаем пользователей
        self.user = User.objects.create_user(email="user1@mail.ru", password="pass")
        self.owner = User.objects.create_user(email="owner@mail.ru", password="pass")
        self.moderator = User.objects.create_user(
            email="moderator@mail.ru", password="pass"
        )
        self.moderator.groups.add(self.moder_group)

        # Данные для обновления профиля
        self.tg_data = {
            "tg_chat_id": "123456789",
        }


class UserTests(BaseAPITestCase):

    def test_create_user(self):
        """
        Тест создания нового пользователя
        """
        data = {
            "email": "newuser@example.com",
            "password": "newpassword",
        }
        response = self.client.post(reverse("users:user-register"), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 4)

    def test_retrieve_own_profile(self):
        """
        Тест получения данных собственного профиля
        """
        self.client.force_authenticate(user=self.owner)
        url = reverse("users:user-retrieve", args=[self.owner.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "owner@mail.ru")

    def test_moderator_retrieve_user_profile(self):
        """
        Тест получения данных профиля пользователя модератором
        """
        self.client.force_authenticate(user=self.moderator)
        url = reverse("users:user-retrieve", args=[self.user.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "user1@mail.ru")

    def test_retrieve_other_user_profile(self):
        """
        Тест попытки получения чужого профиля
        """
        self.client.force_authenticate(user=self.user)
        url = reverse("users:user-retrieve", args=[self.owner.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_own_profile(self):
        """
        Тест обновления собственного профиля
        """
        self.client.force_authenticate(user=self.owner)
        url = reverse("users:user-update", args=[self.owner.pk])
        response = self.client.patch(url, self.tg_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["tg_chat_id"], "123456789")

    def test_update_other_user_profile(self):
        """
        Тест попытки обновления чужого профиля
        """
        self.client.force_authenticate(user=self.user)
        url = reverse("users:user-update", args=[self.owner.pk])
        response = self.client.patch(url, self.tg_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_list_by_moderator(self):
        """
        Тест просмотра всех пользователей Модератором.
        """
        self.client.force_authenticate(user=self.moderator)
        response = self.client.get(reverse("users:user-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 3)

    def test_user_list_by_registered_user(self):
        """
        Тест просмотра всех пользователей обычным пользователем.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse("users:user-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_delete_by_another_user(self):
        """
        Тест: пользователь не может удалить учетную запись другого пользователя.
        """
        self.client.force_authenticate(user=self.user)
        url = reverse("users:user-delete", args=[self.owner.pk])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(User.objects.filter(pk=self.owner.pk).exists())

    def test_user_delete_by_owner(self):
        """
        Тест: пользователь может удалить свою учетную запись.
        """
        self.client.force_authenticate(user=self.owner)
        url = reverse("users:user-delete", args=[self.owner.pk])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.owner.pk).exists())

    def test_user_delete_by_moderator(self):
        """
        Тест: Модератор может удалять учетные записи пользователей.
        """
        self.client.force_authenticate(user=self.moderator)
        url = reverse("users:user-delete", args=[self.user.pk])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.user.pk).exists())
