import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function SuperAdminRoute({ children }: { children?: React.ReactNode }) {
  const { isSuperAdmin, componyCode } = useAuth();

  if (!isSuperAdmin) {
    return <Navigate to={componyCode ? `/employees/${componyCode}` : "/auth/sign-in"} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
