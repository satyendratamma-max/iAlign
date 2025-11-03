import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ProjectActivity {
  id: number;
  projectId: number;
  userId?: number;
  activityType: 'comment' | 'status_change' | 'field_update' | 'milestone' | 'allocation' | 'requirement' | 'dependency' | 'system_event' | 'task' | 'action_item';
  content?: string;
  changes?: any;
  relatedEntityType?: string;
  relatedEntityId?: number;
  parentActivityId?: number;
  metadata?: any;
  isPinned: boolean;
  isEdited: boolean;
  editedDate?: string;
  // Task-specific fields
  assigneeId?: number;
  taskStatus?: 'open' | 'in_progress' | 'completed' | 'cancelled';
  taskPriority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completedDate?: string;
  createdDate: string;
  modifiedDate: string;
  isActive: boolean;
  author?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  project?: {
    id: number;
    name: string;
    status: string;
    priority: string;
  };
  replies?: ProjectActivity[];
}

export interface ActivityPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ActivitiesResponse {
  pinned: ProjectActivity[];
  activities: ProjectActivity[];
  pagination: ActivityPagination;
}

/**
 * Get all activities for a project
 */
export const getProjectActivities = async (
  projectId: number,
  params?: {
    type?: string;
    limit?: number;
    offset?: number;
    includePinned?: boolean;
  }
): Promise<ActivitiesResponse> => {
  const response = await api.get(`/projects/${projectId}/activities`, { params });
  return response.data.data;
};

/**
 * Create a new activity (comment, etc.)
 */
export const createActivity = async (
  projectId: number,
  data: {
    activityType: string;
    content?: string;
    changes?: any;
    relatedEntityType?: string;
    relatedEntityId?: number;
    parentActivityId?: number;
    metadata?: any;
  }
): Promise<ProjectActivity> => {
  const response = await api.post(`/projects/${projectId}/activities`, data);
  return response.data.data;
};

/**
 * Update an activity
 */
export const updateActivity = async (
  activityId: number,
  data: {
    content?: string;
    metadata?: any;
  }
): Promise<ProjectActivity> => {
  const response = await api.put(`/activities/${activityId}`, data);
  return response.data.data;
};

/**
 * Delete an activity
 */
export const deleteActivity = async (activityId: number): Promise<void> => {
  await api.delete(`/activities/${activityId}`);
};

/**
 * Pin/unpin an activity
 */
export const togglePinActivity = async (activityId: number): Promise<ProjectActivity> => {
  const response = await api.put(`/activities/${activityId}/pin`);
  return response.data.data;
};

export interface MentionUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

/**
 * Search users for mention autocomplete
 */
export const searchUsers = async (query: string): Promise<MentionUser[]> => {
  const response = await api.get('/users/search/mention', {
    params: { q: query },
  });
  return response.data.data;
};

/**
 * Create a new task
 */
export const createTask = async (
  projectId: number,
  data: {
    content: string;
    assigneeId?: number;
    taskPriority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    metadata?: any;
  }
): Promise<ProjectActivity> => {
  const response = await api.post(`/projects/${projectId}/tasks`, data);
  return response.data.data;
};

/**
 * Update task status
 */
export const updateTaskStatus = async (
  activityId: number,
  taskStatus: 'open' | 'in_progress' | 'completed' | 'cancelled'
): Promise<ProjectActivity> => {
  const response = await api.put(`/activities/${activityId}/status`, { taskStatus });
  return response.data.data;
};

/**
 * Assign task to a user
 */
export const assignTask = async (
  activityId: number,
  assigneeId: number
): Promise<ProjectActivity> => {
  const response = await api.put(`/activities/${activityId}/assign`, { assigneeId });
  return response.data.data;
};

/**
 * Convert a comment to a task
 */
export const convertToTask = async (
  activityId: number,
  data: {
    assigneeId?: number;
    taskPriority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
  }
): Promise<ProjectActivity> => {
  const response = await api.put(`/activities/${activityId}/convert-to-task`, data);
  return response.data.data;
};

export interface TasksResponse {
  tasks: ProjectActivity[];
  statusCounts: {
    open: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  pagination: ActivityPagination;
}

export interface MentionsResponse {
  mentions: ProjectActivity[];
  pagination: ActivityPagination;
}

export interface ActivityFeedResponse {
  activities: ProjectActivity[];
  pagination: ActivityPagination;
}

/**
 * Get all tasks assigned to a user
 */
export const getUserTasks = async (
  userId: number,
  params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<TasksResponse> => {
  const response = await api.get(`/users/${userId}/tasks`, { params });
  return response.data.data;
};

/**
 * Get all mentions for a user
 */
export const getUserMentions = async (
  userId: number,
  params?: {
    limit?: number;
    offset?: number;
  }
): Promise<MentionsResponse> => {
  const response = await api.get(`/users/${userId}/mentions`, { params });
  return response.data.data;
};

/**
 * Get user's combined activity feed (tasks + mentions)
 */
export const getUserActivityFeed = async (
  userId: number,
  params?: {
    limit?: number;
    offset?: number;
  }
): Promise<ActivityFeedResponse> => {
  const response = await api.get(`/users/${userId}/activity-feed`, { params });
  return response.data.data;
};
