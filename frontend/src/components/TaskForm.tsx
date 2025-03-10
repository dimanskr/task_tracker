import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  FormHelperText,
  Stack
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Task, Employee } from '../types';
import { createTask, updateTask, getTask, getEmployees, getTasks } from '../api';

interface ValidationErrors {
  [key: string]: string[];
}

interface TaskFormProps {
  mode: 'create' | 'edit';
}

interface TaskFormData extends Partial<Task> {
  executor_id?: number | null;
}

export const TaskForm: React.FC<TaskFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'new',
    deadline: '',
    executor_id: null,
    parent_task: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [employeesData, tasksData] = await Promise.all([
          getEmployees(),
          getTasks()
        ]);
        
        setEmployees(employeesData);
        setAvailableTasks(tasksData.results);

        if (mode === 'edit' && id) {
          const taskData = await getTask(parseInt(id));
          setFormData({
            ...taskData,
            executor_id: taskData.executor?.id || null
          });
        }
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
    };

    fetchData();
  }, [mode, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    
    try {
      setLoading(true);
      const { executor_id, ...taskData } = formData;
      
      const dataToSend = {
        ...taskData,
        executor: executor_id
      };
      
      if (mode === 'create') {
        await createTask(dataToSend);
      } else if (id) {
        await updateTask(parseInt(id), dataToSend);
      }
      navigate('/');
    } catch (error: any) {
      if (error.response?.status === 401) {
        navigate('/login', { state: { message: 'Необходима авторизация' } });
        return;
      }
      if (error.response?.status === 403) {
        setError('У вас нет прав для выполнения этого действия');
        return;
      }
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        console.log('Raw error data:', errorData);
        
        if (typeof errorData === 'object') {
          setValidationErrors(errorData);
          // Формируем список ошибок валидации
          const errorMessages = Object.entries(errorData)
            .flatMap(([field, errors]) => {
              console.log(`Processing field "${field}" with errors:`, errors);
              const errArray = Array.isArray(errors) ? errors : [errors];
              console.log('Converted to array:', errArray);
              
              // Если это общая ошибка формы
              if (field === 'non_field_errors') {
                return errArray;
              }
              
              // Для остальных полей добавляем название поля к каждой ошибке
              const fieldName = {
                title: 'Название',
                description: 'Описание',
                deadline: 'Дедлайн',
                status: 'Статус',
                executor: 'Исполнитель',
                parent_task: 'Родительская задача'
              }[field] || field;
              
              const result = errArray.map(err => `${fieldName}: ${err}`);
              console.log('Final messages for field:', result);
              return result;
            })
            .filter(Boolean);
          console.log('Final error messages:', errorMessages);
          setError(errorMessages.join('\n'));
        } else {
          setError(errorData || 'Ошибка валидации формы');
        }
      } else {
        setError(error.response?.data?.detail || 'Произошла ошибка при сохранении задачи');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: [] }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
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
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        {mode === 'create' ? 'Создание задачи' : 'Редактирование задачи'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            name="title"
            label="Название"
            value={formData.title || ''}
            onChange={handleTextChange}
            fullWidth
            required
            error={!!validationErrors.title}
            helperText={validationErrors.title?.join('\n')}
          />

          <TextField
            name="description"
            label="Описание"
            value={formData.description || ''}
            onChange={handleTextChange}
            fullWidth
            multiline
            rows={4}
            error={!!validationErrors.description}
            helperText={validationErrors.description?.join('\n')}
          />

          <TextField
            name="deadline"
            label="Дедлайн"
            type="datetime-local"
            value={formData.deadline ? formData.deadline.slice(0, 16) : ''}
            onChange={handleTextChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            error={!!validationErrors.deadline}
            helperText={validationErrors.deadline?.join('\n')}
          />

          <FormControl 
            fullWidth
            error={!!validationErrors.status}
          >
            <InputLabel>Статус</InputLabel>
            <Select
              name="status"
              value={formData.status || 'new'}
              onChange={handleSelectChange}
              label="Статус"
            >
              <MenuItem value="new">Новая</MenuItem>
              <MenuItem value="in_progress">В работе</MenuItem>
              <MenuItem value="completed">Завершена</MenuItem>
              <MenuItem value="canceled">Отменена</MenuItem>
            </Select>
            {validationErrors.status && (
              <FormHelperText>
                {validationErrors.status.join('\n')}
              </FormHelperText>
            )}
          </FormControl>

          <FormControl 
            fullWidth
            error={!!validationErrors.executor}
          >
            <InputLabel>Исполнитель</InputLabel>
            <Select
              name="executor_id"
              value={formData.executor_id || ''}
              onChange={handleSelectChange}
              label="Исполнитель"
            >
              <MenuItem value="">Не назначен</MenuItem>
              {employees.map(employee => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.full_name}
                </MenuItem>
              ))}
            </Select>
            {validationErrors.executor && (
              <FormHelperText>
                {validationErrors.executor.join('\n')}
              </FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Родительская задача</InputLabel>
            <Select
              name="parent_task"
              value={formData.parent_task || ''}
              onChange={handleSelectChange}
              label="Родительская задача"
            >
              <MenuItem value="">Нет родительской задачи</MenuItem>
              {availableTasks
                .filter(task => task.id !== Number(id)) // Исключаем текущую задачу из списка
                .map(task => (
                  <MenuItem key={task.id} value={task.id}>
                    {task.title}
                  </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {mode === 'create' ? 'Создать' : 'Сохранить'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Отмена
            </Button>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
};