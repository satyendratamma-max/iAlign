import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FiltersState {
  selectedDomainIds: number[];
  selectedBusinessDecisions: string[];
}

// Load initial state from localStorage
const loadFiltersFromStorage = (): FiltersState => {
  try {
    const stored = localStorage.getItem('globalFilters');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading filters from localStorage:', error);
  }
  return {
    selectedDomainIds: [],
    selectedBusinessDecisions: [],
  };
};

// Save filters to localStorage
const saveFiltersToStorage = (state: FiltersState) => {
  try {
    localStorage.setItem('globalFilters', JSON.stringify(state));
  } catch (error) {
    console.error('Error saving filters to localStorage:', error);
  }
};

const initialState: FiltersState = loadFiltersFromStorage();

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setDomainFilter: (state, action: PayloadAction<number[]>) => {
      state.selectedDomainIds = action.payload;
      saveFiltersToStorage(state);
    },
    setBusinessDecisionFilter: (state, action: PayloadAction<string[]>) => {
      state.selectedBusinessDecisions = action.payload;
      saveFiltersToStorage(state);
    },
    clearAllFilters: (state) => {
      state.selectedDomainIds = [];
      state.selectedBusinessDecisions = [];
      saveFiltersToStorage(state);
    },
    clearDomainFilter: (state) => {
      state.selectedDomainIds = [];
      saveFiltersToStorage(state);
    },
    clearBusinessDecisionFilter: (state) => {
      state.selectedBusinessDecisions = [];
      saveFiltersToStorage(state);
    },
  },
});

export const {
  setDomainFilter,
  setBusinessDecisionFilter,
  clearAllFilters,
  clearDomainFilter,
  clearBusinessDecisionFilter,
} = filtersSlice.actions;

export default filtersSlice.reducer;
