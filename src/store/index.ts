import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import createSagaMiddleware from "redux-saga";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import apiAuthReducer from "@/redux/slices/authSlice";
import rootSaga from "@/saga";

const sagaMiddleware = createSagaMiddleware();

const persistConfig = {
  key: "insight-root",
  storage,
  whitelist: ["auth", "apiAuth"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  apiAuth: apiAuthReducer,
  // new feature reducers added here
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
