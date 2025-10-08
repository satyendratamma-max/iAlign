import api from './api';

export interface Scenario {
  id: number;
  name: string;
  description?: string;
  status: 'planned' | 'published';
  createdBy: number;
  createdDate: Date;
  publishedBy?: number;
  publishedDate?: Date;
  parentScenarioId?: number;
  segmentFunctionId?: number;
  metadata?: any;
  isActive: boolean;
  modifiedDate: Date;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  publisher?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ScenarioStats {
  scenarioId: number;
  scenarioName: string;
  status: string;
  projectCount: number;
  resourceCount: number;
  milestoneCount: number;
  dependencyCount: number;
}

export interface CreateScenarioRequest {
  name: string;
  description?: string;
  segmentFunctionId?: number;
  metadata?: any;
}

export interface CloneScenarioRequest {
  name?: string;
  description?: string;
}

export interface UpdateScenarioRequest {
  name?: string;
  description?: string;
  metadata?: any;
}

const scenarioApi = {
  // Get all scenarios (filtered by user role)
  getAll: async (): Promise<Scenario[]> => {
    const response = await api.get('/scenarios');
    return response.data.data;
  },

  // Get scenario by ID
  getById: async (id: number): Promise<Scenario> => {
    const response = await api.get(`/scenarios/${id}`);
    return response.data.data;
  },

  // Get scenario statistics
  getStats: async (id: number): Promise<ScenarioStats> => {
    const response = await api.get(`/scenarios/${id}/stats`);
    return response.data.data;
  },

  // Create new scenario
  create: async (data: CreateScenarioRequest): Promise<Scenario> => {
    const response = await api.post('/scenarios', data);
    return response.data.data;
  },

  // Clone existing scenario
  clone: async (id: number, data: CloneScenarioRequest): Promise<Scenario> => {
    const response = await api.post(`/scenarios/${id}/clone`, data);
    return response.data.data;
  },

  // Update scenario
  update: async (id: number, data: UpdateScenarioRequest): Promise<Scenario> => {
    const response = await api.put(`/scenarios/${id}`, data);
    return response.data.data;
  },

  // Publish scenario (Admin/Domain Manager only)
  publish: async (id: number): Promise<Scenario> => {
    const response = await api.put(`/scenarios/${id}/publish`);
    return response.data.data;
  },

  // Delete scenario
  delete: async (id: number): Promise<void> => {
    await api.delete(`/scenarios/${id}`);
  },
};

export default scenarioApi;
