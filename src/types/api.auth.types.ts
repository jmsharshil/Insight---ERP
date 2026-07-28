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
  linked_students: null | string[];
  branch?: string | null;
  organization?: string;
  organization_name?: string;
  profile_pic?: string | null;
  accessible_modules?: string[];
  canDelete?: boolean;
  canExport?: boolean;
}

export interface LoginResponse {
  message: string;
  otp_required?: boolean;
  email?: string;
  organization?: string;
  organization_name?: string;
  access?: string;
  refresh?: string;
  user?: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}
