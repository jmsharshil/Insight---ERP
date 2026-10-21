import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import AutoLogoutHandler from "@/components/auth/AutoLogoutHandler";
import type { ModuleId } from "@/types/role.types";

interface ProtectedRouteProps {
  module?: ModuleId;
}

export default function ProtectedRoute({ module }: ProtectedRouteProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const { hasModule } = useRole();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a student or parent attempts to access protected web ERP routes, redirect to login with popup notice
  if (user?.role === "student" || user?.role === "parents" || user?.role === "parent") {
    logout();
    return <Navigate to="/login?app_required=true" replace />;
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
