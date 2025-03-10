import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Grid
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from '../types';
import { getUser, updateUser, deleteUser } from '../api';

export const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const currentUserId = localStorage.getItem('userId');
  const isOwnProfile = currentUserId === id;
  const isModerator = localStorage.getItem('isModerator') === 'true';
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          setError('Идентификатор пользователя не указан');
          return;
        }

        console.log('Fetching user with ID:', id);
        const userId = parseInt(id);
        
        if (isNaN(userId)) {
          setError('Некорректный идентификатор пользователя');
          return;
        }

        const userData = await getUser(userId);
        console.log('Received user data:', userData);
        setUser(userData);
        setFormData(userData);
      } catch (error: any) {
        console.error('Error fetching user:', error);
        if (error.response?.status === 401) {
          navigate('/login', { state: { message: 'Необходима авторизация' } });
          return;
        }
        if (error.response?.status === 403) {
          setError('У вас нет прав для просмотра этого профиля');
        } else if (error.response?.status === 404) {
          setError('Пользователь не найден');
        } else {
          setError(error.response?.data?.detail || 'Ошибка при загрузке профиля');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    try {
      const userId = parseInt(id);
      if (isNaN(userId)) {
        setError('Некорректный идентификатор пользователя');
        return;
      }

      const updatedUser = await updateUser(userId, formData);
      setUser(updatedUser);
      setIsEditing(false);
      setError(null);
    } catch (error: any) {
      console.error('Error updating user:', error);
      if (error.response?.status === 403) {
        setError('У вас нет прав для изменения этого профиля');
      } else {
        setError(error.response?.data?.detail || 'Ошибка при обновлении профиля');
      }
    }
  };

  const handleDelete = async () => {
    if (!user || !id) return;

    try {
      const userId = parseInt(id);
      if (isNaN(userId)) {
        setError('Некорректный идентификатор пользователя');
        return;
      }

      await deleteUser(userId);
      if (isOwnProfile) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('isModerator');
        navigate('/login');
      } else {
        navigate('/users');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      if (error.response?.status === 403) {
        setError('У вас нет прав для удаления этого профиля');
      } else {
        setError(error.response?.data?.detail || 'Ошибка при удалении профиля');
      }
    }
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => navigate(-1)}>
              Вернуться назад
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert 
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={() => navigate(-1)}>
              Вернуться назад
            </Button>
          }
        >
          Пользователь не найден
        </Alert>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {isOwnProfile ? 'Мой профиль' : 'Профиль пользователя'}
        </Typography>
        {isOwnProfile && !isEditing && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsEditing(true)}
            >
              Редактировать
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Удалить
            </Button>
          </Box>
        )}
        {!isOwnProfile && (isModerator || isSuperuser) && !isEditing && !user?.is_superuser && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsEditing(true)}
            >
              Редактировать
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Удалить
            </Button>
          </Box>
        )}
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={isEditing ? formData.email : user.email}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Телефон"
              name="phone"
              value={isEditing ? formData.phone || '' : user.phone || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Город"
              name="city"
              value={isEditing ? formData.city || '' : user.city || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Telegram ID"
              name="tg_chat_id"
              value={isEditing ? formData.tg_chat_id || '' : user.tg_chat_id || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
        </Grid>

        {isEditing && (
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
            >
              Сохранить
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setIsEditing(false);
                setFormData(user);
              }}
            >
              Отмена
            </Button>
          </Box>
        )}
      </form>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isOwnProfile
              ? 'Вы действительно хотите удалить свой профиль? Это действие нельзя отменить.'
              : `Вы действительно хотите удалить профиль пользователя ${user.email}?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}; 