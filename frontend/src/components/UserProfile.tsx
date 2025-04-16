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
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Employee, Position } from '../types';
import { getUser, updateUser, deleteUser, getEmployees, getPositions, updateEmployee, createEmployee } from '../api';

export const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
  const [employeeFullName, setEmployeeFullName] = useState('');
  const [linkedEmployee, setLinkedEmployee] = useState<Employee | null>(null);
  
  const currentUserId = localStorage.getItem('userId');
  const isOwnProfile = currentUserId === id;
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const isModerator = localStorage.getItem('isModerator') === 'true';
  const hasManageAccess = isModerator || isSuperuser;
  const canEditProfile = isOwnProfile || isSuperuser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          setError('Идентификатор пользователя не указан');
          return;
        }

        const [userData, employeesData, positionsData] = await Promise.all([
          getUser(parseInt(id)),
          getEmployees(),
          getPositions()
        ]);

        setUser(userData);
        setFormData(userData);
        setEmployees(employeesData);
        setPositions(positionsData);

        // Находим связанного сотрудника
        const linkedEmp = employeesData.find(emp => emp.user_email === userData.email);
        if (linkedEmp) {
          setLinkedEmployee(linkedEmp);
          setEmployeeFullName(linkedEmp.full_name);
          setSelectedPositions(linkedEmp.positions.map(p => p.id));
        }

      } catch (error: any) {
        console.error('Error fetching data:', error);
        if (error.response?.status === 401) {
          navigate('/login', { state: { message: 'Необходима авторизация' } });
          return;
        }
        setError(error.response?.data?.detail || 'Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmployeeFullName(e.target.value);
  };

  const handlePositionsChange = (event: any) => {
    setSelectedPositions(event.target.value as number[]);
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

      // Обновляем данные пользователя
      const updatedUser = await updateUser(userId, formData);
      setUser(updatedUser);

      // Обновляем или создаем сотрудника
      if (linkedEmployee) {
        await updateEmployee(linkedEmployee.id, {
          full_name: employeeFullName,
          positions_ids: selectedPositions,
          user: userId
        });
      } else if (employeeFullName && selectedPositions.length > 0) {
        await createEmployee({
          full_name: employeeFullName,
          positions_ids: selectedPositions,
          user: userId
        });
      }

      setIsEditing(false);
      setError(null);
      
      // Обновляем данные после сохранения
      const [employeesData] = await Promise.all([getEmployees()]);
      const updatedLinkedEmployee = employeesData.find(emp => emp.user_email === updatedUser.email);
      if (updatedLinkedEmployee) {
        setLinkedEmployee(updatedLinkedEmployee);
        setEmployeeFullName(updatedLinkedEmployee.full_name);
        setSelectedPositions(updatedLinkedEmployee.positions.map(p => p.id));
      }

    } catch (error: any) {
      console.error('Error updating data:', error);
      setError(error.response?.data?.detail || 'Ошибка при обновлении данных');
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
          Профиль пользователя
        </Typography>
        {canEditProfile && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsEditing(true)}
              disabled={loading}
            >
              Редактировать
            </Button>
            {(isOwnProfile || isSuperuser) && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
              >
                Удалить профиль
              </Button>
            )}
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
              value={isEditing ? formData.email : user?.email}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Телефон"
              name="phone"
              value={isEditing ? formData.phone || '' : user?.phone || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Город"
              name="city"
              value={isEditing ? formData.city || '' : user?.city || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Telegram ID"
              name="tg_chat_id"
              value={isEditing ? formData.tg_chat_id || '' : user?.tg_chat_id || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>

          {/* Секция данных сотрудника */}
          {(isEditing || linkedEmployee) && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Данные сотрудника
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ФИО сотрудника"
                  name="employeeFullName"
                  value={employeeFullName}
                  onChange={handleEmployeeChange}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Специализации</InputLabel>
                  <Select
                    multiple
                    value={selectedPositions}
                    onChange={handlePositionsChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={positions.find(p => p.id === value)?.name || ''}
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {positions.map((position) => (
                      <MenuItem key={position.id} value={position.id}>
                        {position.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
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
                setFormData(user || {});
                if (linkedEmployee) {
                  setEmployeeFullName(linkedEmployee.full_name);
                  setSelectedPositions(linkedEmployee.positions.map(p => p.id));
                } else {
                  setEmployeeFullName('');
                  setSelectedPositions([]);
                }
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
              : `Вы действительно хотите удалить профиль пользователя ${user?.email}?`}
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