import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FiltersState {
  selectedDomainIds: number[];
  selectedBusinessDecisions: string[];
  selectedFiscalYears: string[];
}

// Load initial state from localStorage
const loadFiltersFromStorage = (): FiltersState => {
  const defaultState: FiltersState = {
    selectedDomainIds: [],
    selectedBusinessDecisions: [],
    selectedFiscalYears: [],
  };

  try {
    const stored = localStorage.getItem('globalFilters');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure backward compatibility with old localStorage data
      return {
        ...defaultState,
        ...parsed,
      };
    }
  } catch (error) {
    console.error('Error loading filters from localStorage:', error);
  }
  return defaultState;
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
    setFiscalYearFilter: (state, action: PayloadAction<string[]>) => {
      state.selectedFiscalYears = action.payload;
      saveFiltersToStorage(state);
    },
    clearAllFilters: (state) => {
      state.selectedDomainIds = [];
      state.selectedBusinessDecisions = [];
      state.selectedFiscalYears = [];
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
    clearFiscalYearFilter: (state) => {
      state.selectedFiscalYears = [];
      saveFiltersToStorage(state);
    },
  },
});

export const {
  setDomainFilter,
  setBusinessDecisionFilter,
  setFiscalYearFilter,
  clearAllFilters,
  clearDomainFilter,
  clearBusinessDecisionFilter,
  clearFiscalYearFilter,
} = filtersSlice.actions;

export default filtersSlice.reducer;
