import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Domain {
  id: number;
  name: string;
  totalMembers: number;
  utilization: number;
}

interface ResourceState {
  domains: Domain[];
  loading: boolean;
}

const initialState: ResourceState = {
  domains: [],
  loading: false,
};

const resourceSlice = createSlice({
  name: 'resource',
  initialState,
  reducers: {
    setDomains: (state, action: PayloadAction<Domain[]>) => {
      state.domains = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setDomains, setLoading } = resourceSlice.actions;
export default resourceSlice.reducer;
