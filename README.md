# Трекер задач сотрудников (TB5)

## Описание задачи:
> **Необходимо реализовать серверное приложение для работы с базой данных, 
представляющее собой трекер задач сотрудников. 
Приложение должно обеспечивать CRUD операции для сотрудников и задач, 
а также предоставлять два специальных эндпоинта для получения информации о загруженности 
сотрудников и важных задачах.\
Трекер задач позволит компании эффективно управлять заданиями, назначенными сотрудникам, 
и обеспечивать прозрачность процессов выполнения задач. 
Это поможет в равномерном распределении нагрузки между сотрудниками 
и своевременном выполнении ключевых задач.**

### Специальные эндпоинты:
> [!NOTE]
>- Занятые сотрудники:
>   - Запрашивает из БД список сотрудников и их задачи, отсортированный по количеству активных задач.
>- Важные задачи:
>   - Запрашивает из БД задачи, которые не взяты в работу, 
  но от которых зависят другие задачи, взятые в работу.
>  - Реализует поиск по сотрудникам, которые могут взять такие задачи 
  (менее загруженный сотрудник или сотрудник выполняющий родительску задачу, 
  если ему назначено на 2 задачи больше чем у наименее загруженного).
>  - Возвращает список объектов в формате: {Важная задача, Срок, [ФИО сотрудника]}.

### Требования:
![Python](https://img.shields.io/badge/python-3.11-blue)
![Django](https://img.shields.io/badge/django-5.1.4-green)
![DRF](https://img.shields.io/badge/DRF-3.15.2-blue)
![Git](https://img.shields.io/badge/git-2.x-orange)
![PEP8](https://img.shields.io/badge/PEP8-compliant-blue)
![README](https://img.shields.io/badge/README-Yes-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Yes-green)
![docker-compose](https://img.shields.io/badge/docker--compose-Yes-green)
![Swagger](https://img.shields.io/badge/OpenAPI-Swagger-blue)
![Redoc](https://img.shields.io/badge/OpenAPI-Redoc-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Connected-blue)
![ORM](https://img.shields.io/badge/ORM-Django-green)
![Validation](https://img.shields.io/badge/Validation-Custom-brightgreen)
![Tests](https://img.shields.io/badge/Tests-Passed-brightgreen)
#### Дополнительные тэги проекта:
![Viewset/Generic](https://img.shields.io/badge/Viewsets-Generic-blue)
![CORS](https://img.shields.io/badge/CORS-Enabled-blue)
![JWT](https://img.shields.io/badge/JWT-Enabled-blue)
![Auth](https://img.shields.io/badge/Auth-Token-blue)
![Permissions](https://img.shields.io/badge/Permissions-Role_based-orange)
![Serializers](https://img.shields.io/badge/Serializers-DRF-blue)

### Структура проекта
<details>
  <summary> посмотреть структуру </summary>

task_tracker
-   .env                    # !!! создайте этот файл скопировав образец настроек из .env.sample !!!
-   .env.sample             # образец переменных окружения
-   coverage-report.txt     # отчет о покрытии тестами
-   requirements.txt        # файл зависимостей (команда pip install -r requirements.txt)
-   Dockerfile              # настройки запуска проекта в докере
-   docker-compose.yaml     # настройки для запуска сети контейнеров
-   config                  # директория основных настроек проекта
    -   settings.py         # основные настройки проекта
    -   urls.py             # основные урлы проекта
- tracker                   # папка проложения трекера
    -   models.py           # модели приложения
    -   paginators.py       # пагинация для отображения списка
    -   serializers.py # сериализаторы
    -   tests.py       # тесты приложения
    -   urls.py        # урлы приложения
    -   validators.py  # дополнительные валидаторы
    -   views.py       # классы обработки запросов        
-   users              # папка проложения пользователей
    -   models.py      # модели приложения
    -   permissions.py # права доступа
    -   serializers.py # сериализаторы
    -   tests.py       # тесты приложения
    -   urls.py        # урлы приложения
    -   views.py       # классы обработки запросов  
    -   fixtures        
            -   groups.json    # данные о группах, которые нужно загрузить в проект (команда python manage.py loaddata users/fixtures/groups.json)

- migrations # директории с модулями миграции для загрузки структуры БД (команда python manage.py migrate)

</details>

## Установка и запуск

*На компьютере должен быть установлен и запущен Docker и docker-compose 
(инструкции по установке и запуску на сайте https://www.docker.com/)!*

### 1. Клонируйте репозиторий с проектом:
   ```bash
   git clone https://github.com/dimanskr/task_tracker.git
   cd task_tracker
   ```
### 2. Скопируйте файл env.sample в .env:
   ```bash
    cp .env.sample .env
   ```
Пропишите в нём настройки подключения к базе данных (минимум POSTGRES_DB) 
([шаблон файла .env](.env.sample)). Для запуска на локалльном компьютере менять 
настройки не требуется.

### 3. Запустите docker-compose:

   ``` bash
   docker-compose up -d --build
   ```
###   *Backend приложение будет доступно по адресу http://127.0.0.1:8000/*

### 4. Создайте учетную запись администратора:
   ``` bash
   docker-compose exec app python manage.py createsuperuser
   ```
   Введите регистрационные данные и зайдите в админку: http://127.0.0.1:8000/admin/*

### 5. Создайте в административной панели группу модераторов или выполните для этого команду:
   ``` bash
   docker-compose exec app python manage.py loaddata users/fixtures/groups.json
   ```
> [!IMPORTANT]
> Группа должна называться "moderators".

### 6. Зарегистрируйте нового пользователя 
Через эндпоинт зарегистрируйте пользователя по адресу http://127.0.0.1:8000/users/register/ 
и назначите ему права модератора в админке.\
Войдите в систему используя программу Postman через эндпоинт http://127.0.0.1:8000/users/login/ \
Скопируйте токен `access`\
Добавьте заголовок `Authorization: Bearer <токен>` в запросах к трекеру с повышенными правами доступа.

# Приложение готово к работе

> [!IMPORTANT]
> Эндпоинты и права доступа указаны ниже.\
> При создании задач используются следующие валидаторы:
> - Дедлайн должен быть больше или равен текущей дате
> - Дедлайн задачи должен быть меньше или равен дедлайну родительской задачи
> - Задача при создании может иметь только статус `new` или `in_progress`

## "Эндпоинты пользователей:"
<details>
  <summary> текстовое описание </summary>
    Регистрация и авторизация доступны всем пользователям, список пользователей только модератору,
    просмотр и удаление профиля - модератору и самому пользователю (своего профиля), 
    изменение профиля только самому пользователю.
</details>

| path                                       | methods        | description                   | permissions  |
|--------------------------------------------|----------------|-------------------------------|--------------| 
| http://127.0.0.1:8000/users/register/      | `POST`         | создание пользователя         | AllowAny     |
| http://127.0.0.1:8000/users/login/         | `POST`         | вход                          | AllowAny     |   
| http://127.0.0.1:8000/users/token/refresh/ | `POST`         | сброс токена                  | AllowAny     |
| http://127.0.0.1:8000/users/               | `GET`          | просмотр списка пользователей | Moder        |
| http://127.0.0.1:8000/users/{id}/          | `GET`          | просмотр пользователя         | Moder, User  |
| http://127.0.0.1:8000/users/update/{id}/   | `PUT`, `PATCH` | изменение пользователя        | User         |
| http://127.0.0.1:8000/users/delete/{id}/   | `DELETE`       | удаление пользователя         | Moder, User  |

## "Эндпоинты сотрудников:"
<details>
  <summary> текстовое описание </summary>
	Просмотр списка работников доступен всем пользователям, 
	создание и удаление только модератору, 
	изменение и просмотр работника - пользователю, к которому привязана сущность работника и модератору.
</details>

| path                                   | methods        | description                 | permissions |
|----------------------------------------|----------------|-----------------------------|-------------| 
| http://127.0.0.1:8000/employees/       | `POST`         | создание сотрудника         | Moder       |
| http://127.0.0.1:8000/employees/       | `GET`          | просмотр списка сотрудников | AllowAny    |   
| http://127.0.0.1:8000/employees/{id}/  | `GET`          | просмотр сотрудника         | Moder, User |
| http://127.0.0.1:8000/employees/{id}/  | `PUT`, `PATCH` | изменение сотрудника        | Moder, User |
| http://127.0.0.1:8000/employees/{id}/  | `DELETE`       | удаление сотрудника         | Moder       |

## "Эндпоинты задач:"
<details>
  <summary> текстовое описание </summary>
	Просмотр списка и отдельной задачи доступен всем, а
	создание, изменение и удаление только модератору.
</details>

| Path                                    | Methods        | Description           | Permissions |
|-----------------------------------------|----------------|-----------------------|-------------|
| http://127.0.0.1:8000/task-list/        | `GET`          | просмотр списка задач | AllowAny    |
| http://127.0.0.1:8000/task/{id}/        | `GET`          | просмотр задачи       | AllowAny    |
| http://127.0.0.1:8000/task/create/      | `POST`         | создание  задачи      | Moder       |
| http://127.0.0.1:8000/task/update/{id}/ | `PUT`, `PATCH` | изменение  задачи     | Moder       |
| http://127.0.0.1:8000/task/delete/{id}/ | `DELETE`       | удаление  задачи      | Moder       |

## "Специальные эндпоинты:"

| Path                                   | Methods | Description                                                            | Permissions |
|----------------------------------------|---------|------------------------------------------------------------------------|-------------|
| http://127.0.0.1:8000/employees-tasks/ | `GET`   | спискок сотрудников в порядке убывания <br/>количества активных задач  | AllowAny    |
| http://127.0.0.1:8000/important-tasks/ | `GET`   | список важных задач со списком сотрудников <br/>для их выполнения      | AllowAny    |

## "Автодокументация API:"

| Path                           | Methods | Description                 | Permissions |
|--------------------------------|---------|-----------------------------|-------------|
| http://127.0.0.1:8000/swagger/ | `GET`   | документация по API Swagger | AllowAny    |
| http://127.0.0.1:8000/redoc/   | `GET`   | документация по API redoc   | AllowAny    |

## "Тестирование приложения"
>   [!NOTE] Тесты хранятся в файлах `tests.py`. Выполните команды и посмотрите результат тестирования
>   ``` bash
>     docker-compose exec app coverage run --source='.' manage.py test
>     docker-compose exec app coverage report
>   ```