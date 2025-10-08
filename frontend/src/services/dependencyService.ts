import api from './api';

export interface ProjectDependency {
  id: number;
  predecessorType: 'project' | 'milestone';
  predecessorId: number;
  predecessorPoint: 'start' | 'end';
  successorType: 'project' | 'milestone';
  successorId: number;
  successorPoint: 'start' | 'end';
  dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
  lagDays: number;
  isActive: boolean;
  createdDate: string;
}

export interface CreateDependencyData {
  predecessorType: 'project' | 'milestone';
  predecessorId: number;
  predecessorPoint: 'start' | 'end';
  successorType: 'project' | 'milestone';
  successorId: number;
  successorPoint: 'start' | 'end';
  dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
  lagDays: number;
}

export interface UpdateDependencyData {
  predecessorPoint?: 'start' | 'end';
  successorPoint?: 'start' | 'end';
  dependencyType?: 'FS' | 'SS' | 'FF' | 'SF';
  lagDays?: number;
}

// Get all dependencies
export const getAllDependencies = async (): Promise<ProjectDependency[]> => {
  const response = await api.get('/project-dependencies');
  return response.data.data;
};

// Get dependency by ID
export const getDependencyById = async (id: number): Promise<ProjectDependency> => {
  const response = await api.get(`/project-dependencies/${id}`);
  return response.data.data;
};

// Create new dependency
export const createDependency = async (data: CreateDependencyData): Promise<ProjectDependency> => {
  const response = await api.post('/project-dependencies', data);
  return response.data.data;
};

// Update dependency
export const updateDependency = async (id: number, data: UpdateDependencyData): Promise<ProjectDependency> => {
  const response = await api.put(`/project-dependencies/${id}`, data);
  return response.data.data;
};

// Delete dependency (soft delete)
export const deleteDependency = async (id: number): Promise<void> => {
  await api.delete(`/project-dependencies/${id}`);
};
