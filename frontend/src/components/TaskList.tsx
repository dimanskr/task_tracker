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
  Pagination,
  Box,
  Chip,
  Button,
  Link,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { Task } from '../types';
import { getTasks, removeAuthToken, deleteTask } from '../api';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

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

const TASKS_PER_PAGE = 10;

type SortField = 'deadline' | 'status' | null;
type SortOrder = 'asc' | 'desc';

const STATUS_ORDER = {
  new: 'Новая',
  in_progress: 'В работе',
  completed: 'Завершена',
  canceled: 'Отменена'
} as const;

export const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const isModerator = localStorage.getItem('isModerator') === 'true';
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const hasManageAccess = isModerator || isSuperuser;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  useEffect(() => {
    // Следим за изменением токена
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const fetchTasks = async (page: number = 1) => {
    try {
      setLoading(true);
      let url = `task-list/?page=${page}`;
      
      // Добавляем параметры сортировки в URL
      if (sortField === 'deadline') {
        url += `&sort_order=${sortOrder}`;
      }
      
      // Фильтрация по статусу (независимо от сортировки)
      if (selectedStatus) {
        url += `&status=${selectedStatus}`;
      }
      
      const data = await getTasks(url);
      
      if (!data || !data.results) {
        console.error('Received invalid data:', data);
        setError('Получены некорректные данные с сервера');
        return;
      }
      
      setTasks(data.results);
      setTotalPages(data.total_pages);
      setCurrentPage(data.current_page);
      setError(null);
    } catch (error: any) {
      console.error('Error details:', error);
      
      if (error.response?.status === 401) {
        removeAuthToken();
        setIsAuthenticated(false);
        navigate('/login', { state: { message: 'Необходима авторизация для доступа к этой функции' } });
        return;
      }

      if (error.response?.status === 403) {
        setError('У вас нет прав для выполнения этого действия. Необходимы права модератора.');
        return;
      }

      const errorMessage = error.response?.data?.detail || error.message;
      setError(`Ошибка при загрузке задач: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(currentPage);
  }, [currentPage, sortField, sortOrder, selectedStatus]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    fetchTasks(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortTasks = (tasksToSort: Task[]) => {
    let result = [...tasksToSort];

    // Фильтрация по статусу
    if (sortField === 'status' && selectedStatus) {
      result = result.filter(task => task.status === selectedStatus);
    }

    // Сортировка по дедлайну
    if (sortField === 'deadline') {
      result.sort((a, b) => {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    return result;
  };

  const handleSortFieldChange = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    try {
      setLoading(true);
      await deleteTask(taskToDelete.id);
      
      // Если на текущей странице осталась только одна задача, переходим на предыдущую страницу
      if (tasks.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        await fetchTasks(currentPage);
      }
      
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (error: any) {
      console.error('Error deleting task:', error);
      if (error.response?.status === 401) {
        navigate('/login', { state: { message: 'Необходима авторизация' } });
      } else if (error.response?.status === 403) {
        setError('У вас нет прав для удаления задачи');
      } else {
        setError(error.response?.data?.detail || 'Ошибка при удалении задачи');
      }
    } finally {
      setLoading(false);
    }
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

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Список задач
        </Typography>
        {hasManageAccess && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/task/create')}
          >
            Создать задачу
          </Button>
        )}
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Сортировка по дедлайну</InputLabel>
          <Select
            value={sortField === 'deadline' ? sortOrder : ''}
            label="Сортировка по дедлайну"
            onChange={(e) => {
              if (e.target.value) {
                setSortField('deadline');
                setSortOrder(e.target.value as SortOrder);
              } else {
                setSortField(null);
              }
              setCurrentPage(1);
            }}
          >
            <MenuItem value="">Без сортировки</MenuItem>
            <MenuItem value="asc">Сначала ближайшие</MenuItem>
            <MenuItem value="desc">Сначала дальние</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Сортировка по статусу</InputLabel>
          <Select
            value={sortField === 'status' ? selectedStatus : ''}
            label="Сортировка по статусу"
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                setSortField('status');
                setSelectedStatus(value);
              } else {
                setSortField(null);
                setSelectedStatus(null);
              }
              setCurrentPage(1);
            }}
          >
            <MenuItem value="">Все статусы</MenuItem>
            {Object.entries(STATUS_ORDER).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {!tasks.length ? (
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          Нет доступных задач
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="25%">Название</TableCell>
                  <TableCell width="20%">Описание</TableCell>
                  <TableCell width="10%">Статус</TableCell>
                  <TableCell width="15%">Дедлайн</TableCell>
                  <TableCell width="10%">Исполнитель</TableCell>
                  <TableCell width="10%">Специализации</TableCell>
                  {hasManageAccess && <TableCell width="10%">Действия</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow 
                    key={task.id}
                    sx={{
                      backgroundColor: task.parent_task ? 'rgba(0, 0, 0, 0.02)' : 'inherit',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        pl: task.parent_task ? 2 : 0
                      }}>
                        {task.parent_task && (
                          <span style={{ 
                            marginRight: '0.5rem', 
                            color: '#666',
                            fontSize: '1.2rem'
                          }}>
                            ↳
                          </span>
                        )}
                        <Link
                          component={RouterLink}
                          to={`/task/${task.id}`}
                          sx={{
                            textDecoration: 'none',
                            color: 'primary.main',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: task.parent_task ? 'normal' : 'medium',
                              color: 'inherit'
                            }}
                          >
                            {task.title}
                          </Typography>
                        </Link>
                        <Chip
                          label={`${task.parent_task || task.id}`}
                          size="small"
                          color="default"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {task.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(task.status)}
                        color={getStatusColor(task.status) as any}
                        size="small"
                        sx={{ minWidth: '90px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {task.deadline ? formatDateTime(task.deadline) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {task.executor ? task.executor.full_name : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {task.required_positions.map((position) => (
                          <Chip
                            key={position.id}
                            label={position.name}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ mb: 0.5 }}
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    {hasManageAccess && (
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/task/update/${task.id}`)}
                          >
                            Изменить
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleDeleteClick(task)}
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
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4 }}>
            <Pagination 
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
              siblingCount={2}
              boundaryCount={1}
            />
          </Box>
        </>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить задачу "{taskToDelete?.title}"?
            {taskToDelete?.executor && (
              <Typography color="error" sx={{ mt: 1 }}>
                Внимание: У этой задачи есть назначенный исполнитель.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
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