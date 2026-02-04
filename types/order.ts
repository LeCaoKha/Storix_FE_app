export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  dueDate?: Date;
  completedDate?: Date;
  relatedOrderId?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  PUTAWAY = 'putaway',
  PICKING = 'picking',
  COUNT = 'count',
  TRANSFER = 'transfer',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}