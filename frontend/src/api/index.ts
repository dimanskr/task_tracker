import axios from 'axios';
import { Employee, Task, ImportantTask, EmployeeWithTasks, User } from '../types';

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
  executor?: number | null;
  parent_task?: number | null;
}

// Конфигурация axios
const api = axios.create({
  baseURL: 'http://localhost:8000/',
});

// Перехватчик для добавления токена к запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
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
  const response = await api.post('task/create/', task);
  return response.data;
};

export const updateTask = async (id: number, task: TaskCreateUpdateData): Promise<Task> => {
  const response = await api.patch(`task/update/${id}/`, task);
  return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
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
  const response = await api.post('employees/', employee);
  return response.data;
};

export const updateEmployee = async (id: number, employee: Partial<Employee>): Promise<Employee> => {
  const response = await api.patch(`employees/${id}/`, employee);
  return response.data;
};

export const deleteEmployee = async (id: number): Promise<void> => {
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
  console.log('Fetching users with token:', localStorage.getItem('token'));
  try {
    const response = await api.get('users/');
    console.log('Users response:', response.data);
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
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`users/delete/${id}/`);
};

// Функции для аутентификации
export const login = async (email: string, password: string) => {
  console.log('Sending login request with:', { email });
  const response = await api.post('users/login/', { email, password });
  console.log('Full login response:', response);
  console.log('Login response data:', response.data);
  
  // Получаем токен доступа
  const { access } = response.data;
  if (!access) {
    throw new Error('Не получен токен доступа');
  }
  
  // Сохраняем токен
  setAuthToken(access);

  // Получаем данные пользователя
  try {
    // Декодируем JWT токен для получения данных пользователя
    const base64Url = access.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const tokenData = JSON.parse(jsonPayload);
    console.log('Decoded token data:', tokenData);

    // Проверяем наличие группы модераторов в токене
    const isModerator = tokenData.groups?.includes('moderators') || false;
    console.log('Is moderator:', isModerator);

    return {
      user_id: tokenData.user_id,
      is_moderator: isModerator,
      is_superuser: tokenData.is_superuser || false,
      access: access
    };
  } catch (error) {
    console.error('Error parsing token:', error);
    throw new Error('Ошибка при обработке токена');
  }
};

export const refreshToken = async (refresh: string) => {
  const response = await api.post('users/token/refresh/', { refresh });
  const { access } = response.data;
  setAuthToken(access);
  return response.data;
};