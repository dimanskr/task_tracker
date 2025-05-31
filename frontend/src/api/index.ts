import axios from 'axios';
import { Employee, Task, ImportantTask, EmployeeWithTasks, User, Position } from '../types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total_pages: number;
  current_page: number;
}

interface TaskCreateUpdateData {
  title?: string;
  description?: string;
  status?: string;
  deadline?: string;
  executor_id?: number | null;
  parent_task?: number | null;
  required_positions_ids?: number[];
}

// Конфигурация axios
const api = axios.create({
  // @ts-ignore
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Перехватчик для добавления токена к запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Перехватчик для обработки ответов
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Удаляем токен при получении 401 ошибки
      localStorage.removeItem('token');
    }
    // Проверяем, что ответ - это JSON
    if (error.response?.headers['content-type']?.includes('text/html')) {
      console.error('API вернул HTML вместо JSON. Проверьте URL и доступность сервера');
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

const checkModeratorAccess = () => {
  const isModerator = localStorage.getItem('isModerator') === 'true';
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  if (!isModerator && !isSuperuser) {
    throw new Error('У вас нет прав для выполнения этого действия');
  }
};

// Функции для работы с задачами
export const getTasks = async (url?: string): Promise<PaginatedResponse<Task>> => {
  const response = await api.get(url || 'task-list/');
  return response.data;
};

export const getTask = async (id: number): Promise<Task> => {
  const response = await api.get(`task/${id}/`);
  return response.data;
};

export const createTask = async (task: TaskCreateUpdateData): Promise<Task> => {
  checkModeratorAccess();
  const response = await api.post('task/create/', task);
  return response.data;
};

export const updateTask = async (id: number, task: TaskCreateUpdateData): Promise<Task> => {
  checkModeratorAccess();
  const response = await api.patch(`task/update/${id}/`, task);
  return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  checkModeratorAccess();
  await api.delete(`task/delete/${id}/`);
};

// Функции для работы с сотрудниками
export const getEmployees = async (): Promise<Employee[]> => {
  const response = await api.get('employees/');
  return response.data;
};

export const getEmployee = async (id: number): Promise<Employee> => {
  const response = await api.get(`employees/${id}/`);
  return response.data;
};

export const createEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
  checkModeratorAccess();
  const response = await api.post('employees/', employee);
  return response.data;
};

export const updateEmployee = async (id: number, employee: Partial<Employee>): Promise<Employee> => {
  const response = await api.patch(`employees/${id}/`, employee);
  return response.data;
};

export const deleteEmployee = async (id: number): Promise<void> => {
  checkModeratorAccess();
  await api.delete(`employees/${id}/`);
};

// Функции для работы с важными задачами и занятостью сотрудников
export const getImportantTasks = async (): Promise<ImportantTask[]> => {
  const response = await api.get('important-tasks/');
  return response.data;
};

export const getEmployeesWithTasks = async (): Promise<EmployeeWithTasks[]> => {
  const response = await api.get('employees-tasks/');
  return response.data;
};

// Функции для работы с пользователями
export const getUsers = async (): Promise<User[]> => {
  // console.log('Fetching users with token:', localStorage.getItem('token'));
  try {
    const response = await api.get('users/');
    // console.log('Users response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUser = async (id: number): Promise<User> => {
  const response = await api.get(`users/${id}/`);
  return response.data;
};

export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  const response = await api.patch(`users/update/${id}/`, userData);
  
  // Если в ответе есть новый токен, обновляем его
  if (response.data.access) {
    setAuthToken(response.data.access);
  }
  
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`users/delete/${id}/`);
};

// Функции для работы с позициями
export const getPositions = async (): Promise<Position[]> => {
  const response = await api.get('positions/');
  return response.data;
};

export const getPosition = async (id: number): Promise<Position> => {
  const response = await api.get(`positions/${id}/`);
  return response.data;
};

export const createPosition = async (position: Omit<Position, 'id'>): Promise<Position> => {
  checkModeratorAccess();
  const response = await api.post('positions/', position);
  return response.data;
};

export const updatePosition = async (id: number, position: Partial<Position>): Promise<Position> => {
  checkModeratorAccess();
  const response = await api.patch(`positions/${id}/`, position);
  return response.data;
};

export const deletePosition = async (id: number): Promise<void> => {
  checkModeratorAccess();
  await api.delete(`positions/${id}/`);
};

// Функции для аутентификации
export const login = async (email: string, password: string) => {
  // console.log('Sending login request with:', { email });
  const response = await api.post('users/login/', { email, password });
  // console.log('Full login response:', response);
  // console.log('Login response data:', response.data);
  
  // Получаем токен доступа
  const { access, user_id, is_moderator, is_superuser } = response.data;
  if (!access) {
    throw new Error('Не получен токен доступа');
  }
  
  // Сохраняем токен
  setAuthToken(access);

  // Сохраняем данные пользователя
  localStorage.setItem('userId', user_id.toString());
  localStorage.setItem('isModerator', is_moderator.toString());
  localStorage.setItem('isSuperuser', is_superuser.toString());

  return {
    user_id,
    is_moderator,
    is_superuser,
    access
  };
};

export const register = async (userData: {
  email: string;
  password: string;
  phone?: string;
  city?: string;
  full_name: string;
  positions_ids: number[];
}) => {
  const response = await api.post('users/register/', userData);
  return response.data;
};

export const refreshToken = async (refresh: string) => {
  const response = await api.post('users/token/refresh/', { refresh });
  const { access } = response.data;
  setAuthToken(access);
  return response.data;
};