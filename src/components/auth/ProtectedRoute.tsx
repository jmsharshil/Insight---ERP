import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import AutoLogoutHandler from "@/components/auth/AutoLogoutHandler";
import type { ModuleId } from "@/types/role.types";

interface ProtectedRouteProps {
  module?: ModuleId;
}

export default function ProtectedRoute({ module }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const { hasModule } = useRole();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (module && !hasModule(module)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <AutoLogoutHandler>
      <Outlet />
    </AutoLogoutHandler>
  );
}
