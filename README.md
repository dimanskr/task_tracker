# Трекер задач сотрудников FULLSTACK

## Описание задачи:
**Необходимо реализовать приложение представляющее собой трекер задач сотрудников. 
Приложение должно обеспечивать CRUD операции для сотрудников и задач, 
а также предоставлять два специальных эндпоинта для получения информации о загруженности 
сотрудников и важных задачах.\
Трекер задач позволит компании эффективно управлять заданиями, назначенными сотрудникам, 
и обеспечивать прозрачность процессов выполнения задач. 
Это поможет в равномерном распределении нагрузки между сотрудниками 
и своевременном выполнении ключевых задач.**

### Тэги проекта:

![Fullstack](https://img.shields.io/badge/Fullstack-Django%20%7C%20React-092E20?logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-14-61DAFB?logo=react&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-1.22-009639?logo=nginx&logoColor=white)
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
![Viewset/Generic](https://img.shields.io/badge/Viewsets-Generic-blue)
![CORS](https://img.shields.io/badge/CORS-Enabled-blue)
![JWT](https://img.shields.io/badge/JWT-Enabled-blue)
![Auth](https://img.shields.io/badge/Auth-Token-blue)
![Permissions](https://img.shields.io/badge/Permissions-Role_based-orange)
![Serializers](https://img.shields.io/badge/Serializers-DRF-blue)

## Установка и запуск

*На компьютере или сервере должен быть установлен и запущен Docker и docker-compose 
(инструкции по установке и запуску на сайте https://www.docker.com/)!*

### 1. Клонируйте репозиторий с проектом:
   ```bash
   git clone https://github.com/dimanskr/task_tracker.git
   cd task_tracker
   ```
### 2. Скопируйте файл `env.sample` в `.env`:
   ```bash
    cp .env.sample .env
   ```
Пропишите в нём настройки подключения к базе данных (минимум POSTGRES_DB) 
([шаблон файла .env](.env.sample)), параметры DEBUG и в ALLOWED_HOSTS пропишите IP хостинга и доменное имя

### 3. Запустите docker-compose:

   ``` bash
   docker-compose up -d --build
   ```
### 4/ Соберите статику Django
``` bash
docker compose exec backend python manage.py collectstatic
docker compose exec backend cp -r /app/collected_static/. /backend_static/static/ 
```

### 5. Создайте учетную запись администратора:
   ``` bash
   docker-compose exec app python manage.py createsuperuser
   ```
   Введите регистрационные данные и зайдите в админку: http://127.0.0.1:8000/admin/*

### 6. Создайте в административной панели группу модераторов или выполните для этого команду:
   ``` bash
   docker-compose exec app python manage.py loaddata users/fixtures/groups.json
   ```
> [!IMPORTANT]
> Группа должна называться "moderators".

### 6. Зарегистрируйте нового пользователя и назначите ему права модератора в админке.

# Приложение готово к работе

> [!NOTE]
> Можете наполнить базу данными тестовыми работниками и задачами
>   ``` bash
>     docker-compose exec app python manage.py loaddata tracker_fixtures.json 
>   ```

## Автодокументация API:

| Path                               | Methods | Description                 | Permissions |
|------------------------------------|---------|-----------------------------|-------------|
| http://127.0.0.1:8000/api/swagger/ | `GET`   | документация по API Swagger | AllowAny    |
| http://127.0.0.1:8000/api/redoc/   | `GET`   | документация по API redoc   | AllowAny    |
