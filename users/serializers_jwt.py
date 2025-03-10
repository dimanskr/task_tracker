from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Добавляем группы пользователя в токен
        token['groups'] = [group.name for group in user.groups.all()]
        
        # Добавляем информацию о суперпользователе
        token['is_superuser'] = user.is_superuser
        
        return token