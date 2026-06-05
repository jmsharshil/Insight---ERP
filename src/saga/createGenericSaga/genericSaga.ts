import { call, put } from "redux-saga/effects";
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { axiosRequest } from "@/service/axiosRequest";
import { clearAuth } from "@/redux/slices/authSlice";

interface GenericSagaAction {
  type: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endPoint: string;
  body?: object | FormData;
  auth?: boolean;
  getResponse?: (data: unknown) => void;
  getError?: (error: unknown) => void;
  setLoading?: (val: boolean) => void;
  showSuccessMessage?: boolean;
}

export function* genericSaga(action: GenericSagaAction): Generator {
  const { method, endPoint, body, auth, getResponse, getError, setLoading } = action;

  try {
    if (setLoading) setLoading(true);

    const config: AxiosRequestConfig = {
      baseURL: import.meta.env.VITE_APP_BASE_URL,
      method,
      url: endPoint,
      data: body,
    };

    if (auth) {
      const loginDataRaw = localStorage.getItem("Insight_Login_Data");
      if (loginDataRaw) {
        try {
          const loginData = JSON.parse(loginDataRaw);
          const token = loginData?.access;
          if (token) {
            config.headers = {
              Authorization: `Bearer ${token}`,
            };
          }
        } catch (e) {
          console.error("Failed to parse login data from local storage", e);
        }
      }
    }

    const response = (yield call(axiosRequest, config)) as AxiosResponse;

    if (getResponse) getResponse(response.data);
    if (setLoading) setLoading(false);
  } catch (error) {
    if (setLoading) setLoading(false);
    if (getError) getError(error);

    const axiosError = error as AxiosError;
    if (axiosError?.response?.status === 401) {
      yield put(clearAuth());
    }

    console.error(error);
  }
}
