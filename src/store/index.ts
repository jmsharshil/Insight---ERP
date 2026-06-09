import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import createSagaMiddleware from "redux-saga";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import apiAuthReducer from "@/redux/slices/authSlice";
import usersReducer from "@/redux/slices/usersSlice";
import dropdownReducer from "@/redux/slices/dropdownSlice";
import crmReducer from "@/redux/slices/crmSlice";
import settingsReducer from "@/redux/slices/settingsSlice";
import rootSaga from "@/saga";
import branchReducer from "@/redux/slices/branchSlice";
import admissionReducer from "@/redux/slices/admissionSlice";
import studentReducer from "@/redux/slices/studentSlice";
import coursesReducer from "@/redux/slices/coursesSlice";
import chatReducer from "@/redux/slices/chatSlice";
import classRoomReducer from "@/redux/slices/classroomSlice";
import timetableReducer from "@/redux/slices/timetableSlice";
import { feesReducer } from "@/redux/slices/feesSlice";

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
  users: usersReducer,
  dropdowns: dropdownReducer,
  crm: crmReducer,
  settings: settingsReducer,
  branch: branchReducer,
  admissions: admissionReducer,
  students: studentReducer,
  courses: coursesReducer,
  chat: chatReducer,
  classRoom: classRoomReducer,
  timetable: timetableReducer,
  fees: feesReducer,
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
