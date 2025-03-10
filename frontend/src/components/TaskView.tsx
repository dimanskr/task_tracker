import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Grid,
  Link
} from '@mui/material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { Task } from '../types';
import { getTask } from '../api';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return 'info';
    case 'in_progress':
      return 'warning';
    case 'completed':
      return 'success';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'new':
      return 'Новая';
    case 'in_progress':
      return 'В работе';
    case 'completed':
      return 'Завершена';
    default:
      return status;
  }
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const TaskView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError('Идентификатор задачи не указан');
          return;
        }
        const taskData = await getTask(parseInt(id));
        setTask(taskData);

        if (taskData.parent_task) {
          const parentTaskData = await getTask(taskData.parent_task);
          setParentTask(parentTaskData);
        }

        setError(null);
      } catch (error: any) {
        console.error('Error fetching task:', error);
        setError(error.response?.data?.detail || 'Ошибка при загрузке задачи');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskData();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!task) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Задача не найдена
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {task.title}
          </Typography>
          <Chip 
            label={getStatusLabel(task.status)}
            color={getStatusColor(task.status) as any}
            sx={{ mb: 2 }}
          />
        </Box>
        {isAuthenticated && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/task/update/${task.id}`)}
          >
            Редактировать
          </Button>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Описание
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {task.description || 'Описание отсутствует'}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom>
            Дедлайн
          </Typography>
          <Typography variant="body1">
            {task.deadline ? formatDateTime(task.deadline) : 'Не указан'}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom>
            Исполнитель
          </Typography>
          <Typography variant="body1">
            {task.executor ? task.executor.full_name : 'Не назначен'}
          </Typography>
        </Grid>

        {task.parent_task && (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Родительская задача
            </Typography>
            <Link
              component={RouterLink}
              to={`/task/${task.parent_task}`}
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              <Typography variant="body1">
                {parentTask ? parentTask.title : `#${task.parent_task}`}
              </Typography>
            </Link>
          </Grid>
        )}

        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Создано: {formatDateTime(task.created_at)}
            {task.updated_at !== task.created_at && (
              <> • Обновлено: {formatDateTime(task.updated_at)}</>
            )}
          </Typography>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
        >
          Вернуться к списку
        </Button>
      </Box>
    </Paper>
  );
}; 