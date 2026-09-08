import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { decodeJwt } from "@/lib/jwt";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  role: string | null;
  componyCode: string | null;
  isSuperAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

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
