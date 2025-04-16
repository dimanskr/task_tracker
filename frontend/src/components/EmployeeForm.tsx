import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Employee, User, Position } from '../types';
import { createEmployee, updateEmployee, getEmployee, getUsers, getPositions } from '../api';

interface ValidationErrors {
  [key: string]: string[];
}

interface FormData {
  full_name: string;
  positions_ids: number[];
  user_id?: number | null;
  user?: number | null;
  phone?: string;
  city?: string;
  tg_chat_id?: string;
}

export const EmployeeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const isModerator = localStorage.getItem('isModerator') === 'true';
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const hasManageAccess = isModerator || isSuperuser;
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    positions_ids: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [usersData, positionsData, employeeData] = await Promise.all([
          getUsers(),
          getPositions(),
          id ? getEmployee(parseInt(id)) : null
        ]);

        console.log('Детальные данные:', {
          employee: {
            id: employeeData?.id,
            full_name: employeeData?.full_name,
            user: employeeData?.user,
            user_email: employeeData?.user_email
          },
          users: usersData.map(u => ({
            id: u.id,
            email: u.email
          }))
        });

        setUsers(usersData);
        setPositions(positionsData);

        if (employeeData) {
          // Ищем пользователя только по email
          const selectedUser = employeeData.user_email 
            ? usersData.find(u => u.email === employeeData.user_email)
            : null;

          console.log('Поиск пользователя:', {
            byEmail: employeeData.user_email ? usersData.find(u => u.email === employeeData.user_email) : null,
            userEmail: employeeData.user_email,
            availableEmails: usersData.map(u => u.email)
          });

          setFormData({
            full_name: employeeData.full_name,
            positions_ids: employeeData.positions.map(p => p.id),
            user_id: selectedUser?.id || null,
            user: selectedUser?.id || null,
            phone: selectedUser?.phone || '',
            city: selectedUser?.city || '',
            tg_chat_id: selectedUser?.tg_chat_id || ''
          });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleUserChange = (userId: number | null) => {
    const selectedUser = users.find(u => u.id === userId);
    setFormData(prev => ({
      ...prev,
      user: userId,
      user_id: userId,
      phone: selectedUser?.phone || '',
      city: selectedUser?.city || '',
      tg_chat_id: selectedUser?.tg_chat_id || ''
    }));
  };

  const handlePositionsChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value as number[];
    setFormData(prev => ({
      ...prev,
      positions_ids: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const employeeData = {
        ...formData,
        user: formData.user_id || null
      };

      if (id) {
        await updateEmployee(parseInt(id), employeeData);
      } else {
        await createEmployee(employeeData as any);
      }

      navigate('/employees');
    } catch (error: any) {
      console.error('Error saving employee:', error);
      if (error.response?.status === 401) {
        navigate('/login', { state: { message: 'Необходима авторизация' } });
        return;
      }
      setError(error.response?.data?.detail || 'Ошибка при сохранении сотрудника');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {id ? 'Редактировать сотрудника' : 'Создать сотрудника'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            required
            fullWidth
            label="ФИО"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="positions-label">Специализации</InputLabel>
            <Select
              labelId="positions-label"
              multiple
              value={formData.positions_ids}
              onChange={handlePositionsChange}
              input={<OutlinedInput label="Специализации" />}
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

          <FormControl fullWidth>
            <InputLabel>Пользователь</InputLabel>
            <Select
              value={formData.user_id ?? ''}
              onChange={(e) => handleUserChange(e.target.value ? Number(e.target.value) : null)}
              label="Пользователь"
            >
              <MenuItem value="">Нет пользователя</MenuItem>
              {users.map(user => (
                <MenuItem key={user.id} value={user.id}>
                  {user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {formData.user_id && hasManageAccess && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Данные пользователя:
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Телефон"
                  name="phone"
                  value={formData.phone || '—'}
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  fullWidth
                  label="Город"
                  name="city"
                  value={formData.city || '—'}
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  fullWidth
                  label="Telegram ID"
                  name="tg_chat_id"
                  value={formData.tg_chat_id || '—'}
                  InputProps={{ readOnly: true }}
                />
              </Stack>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/employees')}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
}; 