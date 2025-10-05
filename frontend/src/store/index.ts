import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import segmentFunctionReducer from './slices/segmentFunctionSlice';
import resourceReducer from './slices/resourceSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    segmentFunction: segmentFunctionReducer,
    resource: resourceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
