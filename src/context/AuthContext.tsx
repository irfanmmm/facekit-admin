import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { decodeJwt } from "@/lib/jwt";
import { get } from "@/hooks/http";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  role: string | null;
  componyCode: string | null;
  isSuperAdmin: boolean;
  permissions: Record<string, boolean>;
  hasPermission: (key: string) => boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const claims = useMemo(() => (token ? decodeJwt(token) : null), [token]);
  const role = claims?.role ?? null;
  const componyCode = claims?.compony_code ?? null;

  // Fetched fresh (not read from the JWT) each time the token changes, so a
  // permission a super_admin just revoked/granted takes effect on the very
  // next page load instead of only after the client_admin logs in again.
  useEffect(() => {
    if (!token) {
      setPermissions({});
      return;
    }
    let cancelled = false;
    get("/admin/my-permissions")
      .then(({ data }) => { if (!cancelled) setPermissions(data.permissions || {}); })
      .catch(() => { if (!cancelled) setPermissions({}); });
    return () => { cancelled = true; };
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        role,
        componyCode,
        isSuperAdmin: role === "super_admin",
        permissions,
        hasPermission: (key: string) => !!permissions[key],
        login,
        logout,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
