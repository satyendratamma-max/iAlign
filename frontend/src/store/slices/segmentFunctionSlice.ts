import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Project {
  id: number;
  name: string;
  status: string;
  priority: string;
  progress: number;
}

interface SegmentFunctionState {
  projects: Project[];
  loading: boolean;
}

const initialState: SegmentFunctionState = {
  projects: [],
  loading: false,
};

const segmentFunctionSlice = createSlice({
  name: 'segmentFunction',
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

export const { setProjects, setLoading } = segmentFunctionSlice.actions;
export default segmentFunctionSlice.reducer;
