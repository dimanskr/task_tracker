export interface Employee {
  id: number;
  user: number | null;
  full_name: string;
  position: string | null;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  deadline: string;
  executor: Employee | null;
  parent_task: number | null;
  created_at: string;
  updated_at: string;
}

export interface ImportantTask {
  title: string;
  deadline: string;
  executors: string[];
}

export interface EmployeeWithTasks {
  full_name: string;
  position: string | null;
  active_task_count: number;
  tasks: Task[];
}

export interface User {
  id: number;
  email: string;
  phone?: string;
  city?: string;
  avatar?: string;
  tg_chat_id?: string;
} 