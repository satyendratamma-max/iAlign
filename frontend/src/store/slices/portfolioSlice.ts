import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Project {
  id: number;
  name: string;
  status: string;
  priority: string;
  progress: number;
}

interface PortfolioState {
  projects: Project[];
  loading: boolean;
}

const initialState: PortfolioState = {
  projects: [],
  loading: false,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setProjects, setLoading } = portfolioSlice.actions;
export default portfolioSlice.reducer;
