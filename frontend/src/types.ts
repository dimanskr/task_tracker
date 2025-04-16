export interface Position {
  id: number;
  name: string;
  description?: string;
}

export interface Employee {
  id: number;
  user?: number | null;
  user_email?: string;
  full_name: string;
  positions: Position[];
  positions_ids?: number[];
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
  required_positions: Position[];
  required_positions_ids?: number[];
}

export interface ImportantTask {
  title: string;
  deadline: string;
  executors: string[];
}

export interface EmployeeWithTasks {
  full_name: string;
  positions: Position[];
  active_task_count: number;
  tasks: Task[];
}

export interface EmployeeFormData {
  full_name: string;
  positions_ids: number[];
  user?: number | null;
  phone?: string;
  city?: string;
  tg_chat_id?: string;
} 