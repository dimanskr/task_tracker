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
  Stack,
  Chip,
  OutlinedInput
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Task, Employee, Position } from '../types';
import { createTask, updateTask, getTask, getEmployees, getTasks, getPositions } from '../api';

interface ValidationErrors {
  [key: string]: string[];
}

interface TaskFormProps {
  mode: 'create' | 'edit';
}

interface TaskFormData extends Partial<Task> {
  executor_id?: number | null;
  required_positions_ids?: number[];
}

export const TaskForm: React.FC<TaskFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'new',
    deadline: '',
    executor_id: null,
    parent_task: null,
    required_positions_ids: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [employeesData, tasksData, positionsData] = await Promise.all([
          getEmployees(),
          getTasks(),
          getPositions()
        ]);
        
        setEmployees(employeesData);
        setAvailableTasks(tasksData.results);
        setPositions(positionsData);

        if (mode === 'edit' && id) {
          const taskData = await getTask(parseInt(id));
          setFormData({
            ...taskData,
            executor_id: taskData.executor?.id || null,
            required_positions_ids: taskData.required_positions.map(p => p.id)
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
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      const { executor_id, required_positions_ids, ...rest } = formData;
      const taskData = {
        ...rest,
        deadline: formData.deadline || undefined,
        executor_id: executor_id || undefined,
        required_positions_ids: required_positions_ids || []
      };

      if (mode === 'create') {
        await createTask(taskData);
      } else if (id) {
        await updateTask(parseInt(id), taskData);
      }

      navigate('/');
    } catch (error: any) {
      console.error('Error submitting task:', error);
      if (error.response?.status === 401) {
        navigate('/login', { state: { message: 'Необходима авторизация' } });
        return;
      }
      if (error.response?.status === 403) {
        setError('У вас нет прав для выполнения этого действия');
        return;
      }
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else if (error.response?.data) {
        setValidationErrors(error.response.data);
      } else {
        setError('Произошла ошибка при сохранении задачи');
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

          <FormControl 
            fullWidth
            error={!!validationErrors.required_positions}
          >
            <InputLabel>Требуемые специализации</InputLabel>
            <Select
              name="required_positions_ids"
              multiple
              value={formData.required_positions_ids || []}
              onChange={handleSelectChange}
              input={<OutlinedInput label="Требуемые специализации" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as number[]).map((value) => (
                    <Chip
                      key={value}
                      label={positions.find(p => p.id === value)?.name || ''}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            >
              {positions.map(position => (
                <MenuItem key={position.id} value={position.id}>
                  {position.name}
                </MenuItem>
              ))}
            </Select>
            {validationErrors.required_positions && (
              <FormHelperText>
                {validationErrors.required_positions.join('\n')}
              </FormHelperText>
            )}
          </FormControl>

          <FormControl 
            fullWidth
            error={!!validationErrors.parent_task}
          >
            <InputLabel>Родительская задача</InputLabel>
            <Select
              name="parent_task"
              value={formData.parent_task || ''}
              onChange={handleSelectChange}
              label="Родительская задача"
            >
              <MenuItem value="">Нет родительской задачи</MenuItem>
              {availableTasks.map(task => (
                <MenuItem key={task.id} value={task.id}>
                  {task.title}
                </MenuItem>
              ))}
            </Select>
            {validationErrors.parent_task && (
              <FormHelperText>
                {validationErrors.parent_task.join('\n')}
              </FormHelperText>
            )}
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
            >
              {mode === 'create' ? 'Создать' : 'Сохранить'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
};