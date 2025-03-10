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
  Link as MuiLink,
  Alert
} from '@mui/material';
import { Employee, User } from '../types';
import { getEmployees, deleteEmployee, getUser } from '../api';
import { useNavigate, Link } from 'react-router-dom';

export const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<Record<number, User | null>>({});
  const [loadingUsers, setLoadingUsers] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const fetchEmployeeUser = async (userId: number | string | null) => {
    if (!userId) {
      console.log('userId is null or undefined, returning');
      return;
    }

    const numericUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
    
    if (isNaN(numericUserId)) {
      console.log('Invalid userId:', userId);
      return;
    }
    
    if (loadingUsers[numericUserId] || users[numericUserId] !== undefined) {
      console.log('User data is already loading or exists for userId:', numericUserId);
      return;
    }

    try {
      console.log('Starting to load user data for userId:', numericUserId);
      setLoadingUsers(prev => ({ ...prev, [numericUserId]: true }));
      const userData = await getUser(numericUserId);
      console.log('Successfully loaded user data:', userData);
      setUsers(prev => ({ ...prev, [numericUserId]: userData }));
    } catch (error: any) {
      console.error('Error fetching user:', error);
      if (error.response?.status === 401) {
        console.log('Unauthorized error, redirecting to login');
        navigate('/login', { state: { message: 'Необходима авторизация' } });
        return;
      }
      if (error.response?.status === 403) {
        console.log('Forbidden error, setting user data to null');
        setUsers(prev => ({ ...prev, [numericUserId]: null }));
      } else {
        console.log('Other error, setting user data to null');
        setUsers(prev => ({ ...prev, [numericUserId]: null }));
      }
    } finally {
      console.log('Finishing user data load for userId:', numericUserId);
      setLoadingUsers(prev => ({ ...prev, [numericUserId]: false }));
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      console.log('Получены сотрудники:', data);
      setEmployees(data);
      
      // Загружаем данные пользователей для каждого сотрудника
      data.forEach(employee => {
        if (employee.user && typeof employee.user === 'number') {
          fetchEmployeeUser(employee.user);
        }
      });
      
      setError(null);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      
      if (error.response?.status === 401) {
        navigate('/login', { state: { message: 'Необходима авторизация для доступа к этой функции' } });
        return;
      }

      if (error.response?.status === 403) {
        setError('У вас нет прав для выполнения этого действия. Необходимы права модератора.');
        return;
      }

      const errorMessage = error.response?.data?.detail || error.message;
      setError(`Ошибка при загрузке сотрудников: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [navigate]);

  const handleDelete = async () => {
    if (!employeeToDelete) return;

    try {
      await deleteEmployee(employeeToDelete.id);
      setEmployees(employees.filter(emp => emp.id !== employeeToDelete.id));
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } catch (error: any) {
      if (error.response?.status === 401) {
        navigate('/login', { state: { message: 'Необходима авторизация' } });
        return;
      }
      if (error.response?.status === 403) {
        setError('У вас нет прав для выполнения этого действия');
        return;
      }
      setError(error.response?.data?.detail || 'Ошибка при удалении сотрудника');
    }
  };

  const openDeleteDialog = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        {!isAuthenticated && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Войти в систему
          </Button>
        )}
      </Box>
    );
  }

  if (!employees.length) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Нет доступных сотрудников
        </Typography>
        {isAuthenticated && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/employee/create')}
            sx={{ mt: 2 }}
          >
            Добавить сотрудника
          </Button>
        )}
      </Box>
    );
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Список сотрудников
        </Typography>
        {isAuthenticated && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/employee/create')}
          >
            Добавить сотрудника
          </Button>
        )}
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ФИО</TableCell>
              <TableCell>Должность</TableCell>
              <TableCell>Пользователь</TableCell>
              {isAuthenticated && <TableCell>Действия</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.full_name}</TableCell>
                <TableCell>{employee.position || '—'}</TableCell>
                <TableCell>
                  {employee.user ? (
                    <Box component="div">
                      {(() => {
                        const userId = typeof employee.user === 'number' ? employee.user : parseInt(String(employee.user));
                        console.log('Employee user ID:', userId, typeof userId);
                        
                        if (isNaN(userId)) {
                          return (
                            <Typography color="error" variant="body2">
                              Некорректный ID пользователя
                            </Typography>
                          );
                        }

                        if (loadingUsers[userId]) {
                          return <CircularProgress size={20} />;
                        }

                        const userData = users[userId];
                        if (userData) {
                          return (
                            <MuiLink
                              component={Link}
                              to={`/user/${userId}`}
                              sx={{
                                textDecoration: 'none',
                                color: '#1976d2',
                                '&:hover': {
                                  textDecoration: 'underline'
                                }
                              }}
                            >
                              {userData.email}
                            </MuiLink>
                          );
                        }

                        return (
                          <Typography color="error" variant="body2">
                            Нет доступа к данным пользователя
                          </Typography>
                        );
                      })()}
                    </Box>
                  ) : '—'}
                </TableCell>
                {isAuthenticated && (
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/employee/update/${employee.id}`)}
                      >
                        Изменить
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => openDeleteDialog(employee)}
                      >
                        Удалить
                      </Button>
                    </Box>
                  </TableCell>
                )}
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
            Вы действительно хотите удалить сотрудника {employeeToDelete?.full_name}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}; 