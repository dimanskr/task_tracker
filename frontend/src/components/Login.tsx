import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  Alert
} from '@mui/material';
import { login } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';

interface LoginProps {
  onLoginSuccess: (userId: number, isModerator: boolean, isSuperuser: boolean) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // console.log('Attempting login with email:', email);
      const response = await login(email, password);
      // console.log('Login response:', response);

      if (!response || typeof response !== 'object') {
        throw new Error('Некорректный ответ от сервера');
      }

      if (!response.access) {
        throw new Error('Не получен токен доступа');
      }

      if (response.user_id === undefined || response.user_id === null) {
        console.error('Missing user_id in response:', response);
        throw new Error('Не удалось получить ID пользователя из токена');
      }

      const userId = parseInt(String(response.user_id));
      if (isNaN(userId)) {
        console.error('Invalid user_id format:', response.user_id);
        throw new Error('Некорректный формат ID пользователя');
      }

      // console.log('Login successful. User data:', { 
      //   userId, 
      //   isModerator: response.is_moderator,
      //   isSuperuser: response.is_superuser,
      //   token: response.access 
      // });
      
      onLoginSuccess(userId, response.is_moderator, response.is_superuser);
      navigate(location.state?.from || '/');
    } catch (error: any) {
      // console.error('Login error:', error);
      if (error.response?.status === 401) {
        setError('Неверный email или пароль');
      } else if (error.response?.status === 400) {
        setError(error.response.data?.detail || 'Некорректные данные для входа');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Ошибка при входе в систему');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Вход в систему
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}; 