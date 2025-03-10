export interface Employee {
  id: number;
  full_name: string;
  position: string;
  user: number | null;
  email?: string;
  phone?: string;
  city?: string;
  tg_chat_id?: string;
}

export interface User {
  id: number;
  email: string;
  phone?: string;
  city?: string;
  avatar?: string;
  tg_chat_id?: string;
  is_superuser?: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'new' | 'in_progress' | 'completed' | 'canceled';
  created: string;
  updated: string;
  deadline: string | null;
  parent_task: number | null;
  executor: Employee | null;
}

export interface ImportantTask {
  title: string;
  deadline: string;
  executors: string[];
}

export interface EmployeeWithTasks {
  full_name: string;
  position: string;
  active_task_count: number;
  tasks: Task[];
} 