import { useAuth } from "./useAuth";
import { ROLES } from "@/constants/roles";
import type { ModuleId } from "@/types/role.types";

export const useRole = () => {
  const { user } = useAuth();
  const role = user ? ROLES[user.role as keyof typeof ROLES] : null;

  return {
    role,
    hasModule: (module: string) => {
      // Globally allow notifications and support for all users/roles
      if (module === "notifications" || module === "support") return true;

      let userMods: any = user?.accessible_modules;
      if (typeof userMods === "string") {
        try {
          userMods = JSON.parse(userMods);
        } catch {
          userMods = (userMods as string).split(",").map((s) => s.trim()).filter(Boolean);
        }
      }

      if (Array.isArray(userMods) && userMods.length > 0) {
        return userMods.includes(module);
      }
      return !!role?.modules.includes(module as ModuleId);
    },
    canDelete: user?.canDelete ?? !!role?.canDelete,
    canExport: user?.canExport ?? !!role?.canExport,
  };
};
