import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { EmployeeWithTasks } from '../types';
import { getEmployeesWithTasks } from '../api';

export const EmployeesTasks: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const data = await getEmployeesWithTasks();
        setEmployees(data);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching employees with tasks:', error);
        setError(error.response?.data?.detail || 'Ошибка при загрузке данных о сотрудниках');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
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

  if (!employees.length) {
    return (
      <Typography variant="h6" align="center" sx={{ mt: 4 }}>
        Нет данных о занятости сотрудников
      </Typography>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Занятость сотрудников
      </Typography>
      <Grid container spacing={2}>
        {employees.map((employee) => (
          <Grid item xs={12} sm={6} md={4} key={employee.full_name}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {employee.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {employee.position || 'Должность не указана'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 2 }}>
                  <Typography variant="body1">
                    Активных задач:
                  </Typography>
                  <Chip 
                    label={employee.active_task_count}
                    color={employee.active_task_count > 3 ? 'error' : 'primary'}
                    size="small"
                  />
                </Box>
                {employee.tasks && employee.tasks.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Текущие задачи:
                    </Typography>
                    <List dense>
                      {employee.tasks
                        .filter(task => task.status === 'in_progress')
                        .map(task => (
                          <ListItem key={task.id}>
                            <ListItemText 
                              primary={task.title}
                              secondary={`Дедлайн: ${new Date(task.deadline).toLocaleDateString()}`}
                            />
                          </ListItem>
                        ))}
                    </List>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}; 