import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email?: string;
  country?: string;
  bio?: string;
  avatar?: string;
  score?: number;
  isAdmin: boolean;
  stats?: {
    solves: number;
    score: number;
    rank: number;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    country?: string;
    bio?: string;
  }) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem("ctf_token");
    if (!savedToken) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
        credentials: "include",
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setToken(savedToken);
      } else {
        localStorage.removeItem("ctf_token");
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      localStorage.removeItem("ctf_token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem("ctf_token", token);
    } else {
      localStorage.removeItem("ctf_token");
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const response = await apiRequest("POST", "/api/login", {
      username,
      password,
    });
    
    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    country?: string;
    bio?: string;
  }) => {
    const response = await apiRequest("POST", "/api/register", userData);
    
    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
  };

  const adminLogin = async (username: string, password: string) => {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      throw new Error("Admin login failed");
    }
    
    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("ctf_token", data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const contextValue = {
    user,
    token,
    login,
    register,
    adminLogin,
    logout,
    refreshUser,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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

export function useRequireAuth() {
  const { user } = useAuth();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export function useRequireAdmin() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return null;
  }
  if (!user || !user.isAdmin) {
    throw new Error("Admin access required");
  }
  return user;
}