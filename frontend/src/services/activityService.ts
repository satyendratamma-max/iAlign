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
  activityType: 'comment' | 'status_change' | 'field_update' | 'milestone' | 'allocation' | 'requirement' | 'dependency' | 'system_event';
  content?: string;
  changes?: any;
  relatedEntityType?: string;
  relatedEntityId?: number;
  parentActivityId?: number;
  metadata?: any;
  isPinned: boolean;
  isEdited: boolean;
  editedDate?: string;
  createdDate: string;
  modifiedDate: string;
  isActive: boolean;
  author?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
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
