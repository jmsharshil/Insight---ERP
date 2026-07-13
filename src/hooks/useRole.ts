import { useAuth } from "./useAuth";
import { ROLES } from "@/constants/roles";
import type { ModuleId } from "@/types/role.types";

export const useRole = () => {
  const { user } = useAuth();
  const role = user ? ROLES[user.role as keyof typeof ROLES] : null;

  return {
    role,
    hasModule: (module: string) => {
      if (user?.accessible_modules) {
        return user.accessible_modules.includes(module);
      }
      return !!role?.modules.includes(module as ModuleId);
    },
    canDelete: user?.canDelete ?? !!role?.canDelete,
    canExport: user?.canExport ?? !!role?.canExport,
  };
};
