import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Employee } from '../types';
import { createEmployee, updateEmployee, getEmployee } from '../api';

interface ValidationErrors {
  [key: string]: string[];
}

interface EmployeeFormProps {
  mode: 'create' | 'edit';
}

interface EmployeeFormData extends Omit<Employee, 'id'> {
  full_name: string;
  position: string;
  user: number | null;
  email?: string;
  phone?: string;
  city?: string;
  tg_chat_id?: string;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<EmployeeFormData>({
    full_name: '',
    position: '',
    user: null,
    email: '',
    phone: '',
    city: '',
    tg_chat_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (mode === 'edit' && id) {
        try {
          setLoading(true);
          const data = await getEmployee(parseInt(id));
          setFormData({
            full_name: data.full_name,
            position: data.position,
            user: data.user,
            email: data.email || '',
            phone: data.phone || '',
            city: data.city || '',
            tg_chat_id: data.tg_chat_id || ''
          });
        } catch (error: any) {
          if (error.response?.status === 401) {
            navigate('/login', { state: { message: 'Необходима авторизация' } });
            return;
          }
          if (error.response?.status === 403) {
            setError('У вас нет прав для выполнения этого действия');
            return;
          }
          setError(error.response?.data?.detail || 'Ошибка при загрузке данных');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [mode, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    try {
      setLoading(true);
      const employeeData: EmployeeFormData = {
        full_name: formData.full_name,
        position: formData.position,
        user: formData.user,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        city: formData.city || undefined,
        tg_chat_id: formData.tg_chat_id || undefined
      };

      if (mode === 'create') {
        await createEmployee(employeeData);
      } else if (id) {
        await updateEmployee(parseInt(id), employeeData);
      }
      navigate('/employees');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          setValidationErrors(errorData);
          // Формируем список ошибок валидации
          const errorMessages = Object.entries(errorData)
            .flatMap(([field, errors]) => {
              const errArray = Array.isArray(errors) ? errors : [errors];
              
              // Если это общая ошибка формы
              if (field === 'non_field_errors') {
                return errArray;
              }
              
              // Для остальных полей добавляем название поля к каждой ошибке
              const fieldName = {
                full_name: 'ФИО',
                position: 'Должность',
                email: 'Email',
                phone: 'Телефон',
                city: 'Город',
                tg_chat_id: 'Telegram ID'
              }[field] || field;
              
              return errArray.map(err => `${fieldName}: ${err}`);
            })
            .filter(Boolean);
          setError(errorMessages.join('\n'));
        } else {
          setError(errorData || 'Ошибка валидации формы');
        }
      } else if (error.response?.status === 403) {
        setError('У вас нет прав для выполнения этого действия');
      } else {
        setError(error.response?.data?.detail || 'Произошла ошибка при сохранении сотрудника');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Очищаем ошибку валидации при изменении поля
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: [] }));
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
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {mode === 'create' ? 'Создание сотрудника' : 'Редактирование сотрудника'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              name="full_name"
              label="ФИО"
              value={formData.full_name || ''}
              onChange={handleChange}
              fullWidth
              required
              error={!!validationErrors.full_name}
              helperText={validationErrors.full_name?.join('\n')}
            />

            <TextField
              name="position"
              label="Должность"
              value={formData.position || ''}
              onChange={handleChange}
              fullWidth
              error={!!validationErrors.position}
              helperText={validationErrors.position?.join('\n')}
            />

            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              fullWidth
              error={!!validationErrors.email}
              helperText={validationErrors.email?.join('\n')}
            />

            <TextField
              name="phone"
              label="Телефон"
              value={formData.phone || ''}
              onChange={handleChange}
              fullWidth
              error={!!validationErrors.phone}
              helperText={validationErrors.phone?.join('\n')}
            />

            <TextField
              name="city"
              label="Город"
              value={formData.city || ''}
              onChange={handleChange}
              fullWidth
              error={!!validationErrors.city}
              helperText={validationErrors.city?.join('\n')}
            />

            <TextField
              name="tg_chat_id"
              label="Telegram ID"
              value={formData.tg_chat_id || ''}
              onChange={handleChange}
              fullWidth
              error={!!validationErrors.tg_chat_id}
              helperText={validationErrors.tg_chat_id?.join('\n')}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {mode === 'create' ? 'Создать' : 'Сохранить'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}; 