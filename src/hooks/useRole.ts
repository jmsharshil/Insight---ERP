import { useAuth } from "./useAuth";
import { ROLES } from "@/constants/roles";
import type { ModuleId } from "@/types/role.types";

export const useRole = () => {
  const { user } = useAuth();
  const role = user ? ROLES[user.role] : null;

  return {
    role,
    hasModule: (module: ModuleId) => !!role?.modules.includes(module),
    canDelete: !!role?.canDelete,
    canExport: !!role?.canExport,
  };
};
