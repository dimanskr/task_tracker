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
import { EmployeeWithTasks, Task } from '../types';
import { getEmployeesWithTasks } from '../api';

const getStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'new':
      return 'primary';
    case 'in_progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'canceled':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: Task['status']) => {
  switch (status) {
    case 'new':
      return 'Новая';
    case 'in_progress':
      return 'В работе';
    case 'completed':
      return 'Завершена';
    case 'canceled':
      return 'Отменена';
    default:
      return status;
  }
};

const EmployeeCard: React.FC<{ employee: EmployeeWithTasks }> = ({ employee }) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {employee.full_name}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          Специализации: {employee.positions.map(pos => pos.name).join(', ')}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          Активных задач: {employee.active_task_count}
        </Typography>
        
        {employee.tasks.length > 0 ? (
          <List>
            {employee.tasks.map((task) => (
              <ListItem key={task.id}>
                <ListItemText
                  primary={task.title}
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={getStatusLabel(task.status)}
                        color={getStatusColor(task.status)}
                        size="small"
                      />
                      <Typography variant="body2" component="span">
                        Срок: {new Date(task.deadline || '').toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>Нет активных задач</Typography>
        )}
      </CardContent>
    </Card>
  );
};

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
            <EmployeeCard employee={employee} />
          </Grid>
        ))}
      </Grid>
    </div>
  );
}; 