import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

// Define AuthContext shape
export interface AuthUser {
  username: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE" | null;
  token: string;
  employeeId?: number;
  expiresAt?: number; // Add expiration timestamp
}

interface AuthContextProps {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Try to load user from localStorage with fallback for iframe environments
  const getInitialUser = () => {
    try {
      const token = localStorage.getItem("token");
      const username = localStorage.getItem("username");
      const role = localStorage.getItem("role") as AuthUser["role"];
      const employeeId = localStorage.getItem("employeeId");
      const expiresAt = localStorage.getItem("tokenExpiry");

      if (token && username && role) {
        // Check if token is expired
        if (expiresAt && Date.now() > parseInt(expiresAt)) {
          // Token expired, clear storage
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          localStorage.removeItem("role");
          localStorage.removeItem("employeeId");
          localStorage.removeItem("tokenExpiry");
          return null;
        }

        const user: AuthUser = { username, token, role };
        if (employeeId) user.employeeId = Number(employeeId);
        if (expiresAt) user.expiresAt = Number(expiresAt);
        return user;
      }
    } catch (error) {
      // localStorage access blocked in iframe/insecure context
      console.warn("localStorage access blocked, starting with no user");
    }
    return null;
  };
  const [user, setUserState] = useState<AuthUser | null>(getInitialUser());

  // Define role checking properties
  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "MANAGER";
  const isEmployee = user?.role === "EMPLOYEE";

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("token", user.token);
        localStorage.setItem("username", user.username);
        localStorage.setItem("role", user.role || "");
        if (user.employeeId) localStorage.setItem("employeeId", user.employeeId.toString());
        if (user.expiresAt) localStorage.setItem("tokenExpiry", user.expiresAt.toString());
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        localStorage.removeItem("employeeId");
        localStorage.removeItem("tokenExpiry");
      }
    } catch (error) {
      // localStorage access blocked in iframe/insecure context
      console.warn("localStorage access blocked, cannot persist user data");
    }
  }, [user]);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
  };
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isAdmin, isManager, isEmployee }}>
      {children}
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

export { AuthContext };
