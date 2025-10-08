import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import segmentFunctionReducer from './slices/segmentFunctionSlice';
import resourceReducer from './slices/resourceSlice';
import filtersReducer from './slices/filtersSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    segmentFunction: segmentFunctionReducer,
    resource: resourceReducer,
    filters: filtersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
