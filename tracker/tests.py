from django.contrib.auth.models import Group
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase

from tracker.models import Employee, Task
from tracker.validators import (validate_deadline_not_in_past,
                                validate_deadline_with_parent,
                                validate_status_on_creation)
from users.models import User


class FakeSerializer:
    """
    Фиктивный класс для эмуляции сериализатора с атрибутом instance.
    """

    def __init__(self, instance=None):
        self.instance = instance


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

        # Создание сотрудников
        self.employee = Employee.objects.create(
            full_name="John", position="Java developer"
        )
        self.employee2 = Employee.objects.create(
            user=self.owner, full_name="Jane", position="Python developer"
        )

        # Создание задач
        self.task2 = Task.objects.create(
            title="Task 2", executor=self.employee2, status="in_progress"
        )
        self.task = Task.objects.create(
            title="Task 1", executor=self.employee, status="new", parent_task=self.task2
        )
        self.parent_task = Task.objects.create(
            title="Parent Task",
            executor=self.employee,
            status="new",
            deadline=timezone.now() + timezone.timedelta(days=5),
        )


class EmployeeViewSetTest(BaseAPITestCase):
    """
    Тесты для EmployeeViewSet
    """

    def test_employee_create(self):
        """
        Тест создания сотрудника
        """
        data = {"user": self.user.id, "full_name": "User1", "position": "Web developer"}
        url = reverse("tracker:employees-list")
        self.client.force_authenticate(user=self.moderator)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.client.force_authenticate(user=self.user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_list(self):
        """
        Тест получения списка сотрудников
        """
        url = reverse("tracker:employees-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_employee_update(self):
        """
        Тест обновления сотрудника
        """
        url = reverse("tracker:employees-detail", kwargs={"pk": self.employee2.id})
        data = {"full_name": "Jane Connor", "position": "Full stack developer"}
        self.client.force_authenticate(user=self.moderator)
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resp_data = response.json()
        self.assertEqual(resp_data.get("full_name"), "Jane Connor")
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resp_data = response.json()
        self.assertEqual(resp_data.get("full_name"), "Jane Connor")

    def test_employee_retrieve(self):
        """
        Тест просмотра сотрудника
        """
        url = reverse("tracker:employees-detail", kwargs={"pk": self.employee2.id})
        self.client.force_authenticate(user=self.moderator)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_employee_delete(self):
        """
        Тест удаления сотрудника
        """
        url = reverse("tracker:employees-detail", kwargs={"pk": self.employee.id})
        self.client.force_authenticate(user=self.moderator)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        url = reverse("tracker:employees-detail", kwargs={"pk": self.employee2.id})
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TaskAPIViewTests(BaseAPITestCase):
    """
    Тесты для Task
    """

    def test_task_create(self):
        url = reverse("tracker:task-create")
        data = {
            "title": "New Task",
            "executor": self.employee.id,
            "status": "new",
        }
        self.client.force_authenticate(user=self.moderator)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.client.force_authenticate(user=self.user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_task_list(self):
        """
        Тест получения списка задач
        """
        url = reverse("tracker:task-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get("results")), 3)

    def test_task_retrieve(self):
        """
        Тест просмотра задачи
        """
        url = reverse("tracker:task-retrieve", kwargs={"pk": self.task.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_task_update(self):
        """
        Тест обновления задачи
        """
        url = reverse("tracker:task-update", kwargs={"pk": self.task.id})
        data = {
            "status": "completed",
        }
        self.client.force_authenticate(user=self.moderator)
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resp_data = response.json()
        self.assertEqual(resp_data.get("status"), "completed")
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_task_delete(self):
        """
        Тест удаления задачи
        """
        url = reverse("tracker:task-delete", kwargs={"pk": self.task.id})
        self.client.force_authenticate(user=self.moderator)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        url = reverse("tracker:task-delete", kwargs={"pk": self.task2.id})
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_important_tasks(self):
        url = reverse("tracker:important-tasks-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_employee_tasks(self):
        url = reverse("tracker:employee-tasks-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)


class TaskValidatorsTests(BaseAPITestCase):
    """
    Тесты для валидаторов, использующихся в задаче.
    """

    def test_validate_deadline_not_in_past_with_past_deadline(self):
        """Тест: дата дедлайна должна быть в будущем."""
        data = {"deadline": timezone.now() - timezone.timedelta(days=1)}
        with self.assertRaises(ValidationError) as cm:
            validate_deadline_not_in_past(data)
        self.assertTrue(
            "Дедлайн должен быть больше или равен текущей дате." in str(cm.exception),
            "Unexpected validation error message for past deadline.",
        )

    def test_validate_deadline_not_in_past_with_valid_deadline(self):
        """Тест: дата дедлайна должна быть в будущем (с корректным дедлайном)."""
        data = {"deadline": timezone.now() + timezone.timedelta(days=1)}
        try:
            validate_deadline_not_in_past(data)
        except ValidationError:
            self.fail("ValidationError was raised for a valid deadline.")

    def test_validate_deadline_with_parent_with_invalid_deadline(self):
        """Тест: Дедлайн задачи должен быть меньше или равен дедлайну родительской задачи."""
        data = {
            "deadline": self.parent_task.deadline + timezone.timedelta(days=1),
            "parent_task": self.parent_task,
        }
        with self.assertRaises(ValidationError) as cm:
            validate_deadline_with_parent(data)
        self.assertTrue(
            "Дедлайн задачи должен быть меньше или равен дедлайну родительской задачи."
            in str(cm.exception),
            "Unexpected validation error message for parent task deadline.",
        )

    def test_validate_deadline_with_parent_with_valid_deadline(self):
        """Тест: Дедлайн задачи должен быть меньше или равен дедлайну родительской задачи (с корректным дедлайном)."""
        data = {
            "deadline": self.parent_task.deadline - timezone.timedelta(days=1),
            "parent_task": self.parent_task,
        }
        try:
            validate_deadline_with_parent(data)
        except ValidationError:
            self.fail("ValidationError was raised for a valid parent task deadline.")

    def test_validate_status_on_creation_with_invalid_status(self):
        """Тест: Задача при создании может иметь только статус 'new' или 'in_progress'."""
        data = {"status": "completed"}
        serializer_instance = FakeSerializer()
        with self.assertRaises(ValidationError) as cm:
            validate_status_on_creation(serializer_instance, data)
        self.assertTrue(
            "Задача при создании может иметь только статус 'new' или 'in_progress'."
            in str(cm.exception),
            "Unexpected validation error message for invalid status.",
        )

    def test_validate_status_on_creation_with_valid_status(self):
        """Тест: Задача при создании может иметь только статус 'new' или 'in_progress' (с допустимым статусом)."""
        data = {"status": "new"}
        serializer_instance = FakeSerializer()
        try:
            validate_status_on_creation(serializer_instance, data)
        except ValidationError:
            self.fail("ValidationError was raised for a valid status.")
