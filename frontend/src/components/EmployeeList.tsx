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
import { Employee, User, Position } from '../types';
import { getEmployees, deleteEmployee, getUser } from '../api';
import { useNavigate, Link } from 'react-router-dom';

export const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const isModerator = localStorage.getItem('isModerator') === 'true';
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const hasManageAccess = isModerator || isSuperuser;

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      // console.log('Полученные данные сотрудников:', data);
      setEmployees(data);
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
  }, []);

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
        {hasManageAccess && (
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
        {hasManageAccess && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/employee/create')}
          >
            Добавить сотрудника
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ФИО</TableCell>
              <TableCell>Должность</TableCell>
              <TableCell>Email</TableCell>
              {hasManageAccess && (
                <>
                  <TableCell>Телефон</TableCell>
                  <TableCell>Telegram ID</TableCell>
                </>
              )}
              {hasManageAccess && <TableCell align="right">Действия</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.full_name}</TableCell>
                <TableCell>
                  {employee.positions && employee.positions.length > 0
                    ? employee.positions.map(pos => pos.name).join(', ')
                    : '—'
                  }
                </TableCell>
                <TableCell>
                  {employee.user_email || '—'}
                </TableCell>
                {hasManageAccess && (
                  <>
                    <TableCell>{employee.phone || '—'}</TableCell>
                    <TableCell>{employee.tg_chat_id || '—'}</TableCell>
                  </>
                )}
                {hasManageAccess && (
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
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
            Вы действительно хотите удалить сотрудника "{employeeToDelete?.full_name}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}; 