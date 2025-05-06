import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Stack,
  CircularProgress,
  Box
} from '@mui/material';
import { ImportantTask } from '../types';
import { getImportantTasks } from '../api';

export const ImportantTasks: React.FC = () => {
  const [tasks, setTasks] = useState<ImportantTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await getImportantTasks();
        // console.log('API Response:', response);
        
        if (!Array.isArray(response)) {
          console.error('Response is not an array:', response);
          setError('Получены некорректные данные с сервера (не массив)');
          return;
        }

        // Проверяем структуру каждой задачи
        const isValidTask = (task: any): task is ImportantTask => {
          const hasRequiredFields = 'title' in task && 'deadline' in task && 'executors' in task;
          console.log('Task validation:', { task, hasRequiredFields });
          return hasRequiredFields;
        };

        if (!response.every(isValidTask)) {
          console.error('Some tasks have invalid structure:', response);
          setError('Получены некорректные данные с сервера (неверная структура)');
          return;
        }
        
        setTasks(response);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching important tasks:', error);
        console.error('Error response:', error.response?.data);
        setError(error.response?.data?.detail || 'Ошибка при загрузке важных задач');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="h6" align="center">
        {error}
      </Typography>
    );
  }

  if (!tasks.length) {
    return (
      <Typography variant="h6" align="center" sx={{ mt: 4 }}>
        Нет важных задач
      </Typography>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Важные задачи
      </Typography>
      <Grid container spacing={2}>
        {tasks.map((task, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {task.title}
                </Typography>
                <Typography variant="body2">
                  Дедлайн: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Не указан'}
                </Typography>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Рекомендуемые сотрудники:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {task.executors.map((employee, idx) => (
                    <Chip 
                      key={idx} 
                      label={employee} 
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}; 