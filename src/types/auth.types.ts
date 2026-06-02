import type { RoleId } from "./role.types";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: RoleId;
  branch: string;
  avatar?: string;
  phone: string;
  joinedDate: string;
}
