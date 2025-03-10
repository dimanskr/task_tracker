import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { getUsers, deleteUser } from '../api';

export const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const currentUserId = localStorage.getItem('userId');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      console.log('Fetched users:', data);
      setUsers(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        navigate('/login', { state: { message: 'Необходима авторизация' } });
        return;
      }
      if (error.response?.status === 403) {
        setError('У вас нет прав для просмотра списка пользователей');
      } else {
        setError(error.response?.data?.detail || 'Ошибка при загрузке пользователей');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate]);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setError(null);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      if (error.response?.status === 403) {
        setError('У вас нет прав для удаления пользователей');
      } else {
        setError(error.response?.data?.detail || 'Ошибка при удалении пользователя');
      }
    }
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

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Список пользователей
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Город</TableCell>
              <TableCell>Telegram ID</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone || '—'}</TableCell>
                <TableCell>{user.city || '—'}</TableCell>
                <TableCell>{user.tg_chat_id || '—'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/user/${user.id}`)}
                    >
                      Просмотр
                    </Button>
                    {user.id !== parseInt(currentUserId || '0') && !user.is_superuser && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteClick(user)}
                      >
                        Удалить
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить пользователя {userToDelete?.email}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}; 