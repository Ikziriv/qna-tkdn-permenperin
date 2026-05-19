import React, { createContext, useContext, useState, useCallback } from "react";
import { AuthUser } from "../types";

interface AuthContextType {
  authUser: AuthUser | null;
  setAuthUser: (user: AuthUser | null) => void;
  isAdminLevel: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUserState] = useState<AuthUser | null>(null);

  const setAuthUser = useCallback((user: AuthUser | null) => {
    setAuthUserState(user);
  }, []);

  const isAdminLevel = authUser?.role === "admin" || authUser?.role === "super_admin";

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser, isAdminLevel }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
