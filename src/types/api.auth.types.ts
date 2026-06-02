export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  name: string;
  role: string;
  linked_student: null | string;
}

export interface LoginResponse {
  message: string;
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}
