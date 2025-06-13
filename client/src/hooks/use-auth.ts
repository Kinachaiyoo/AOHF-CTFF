import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("ctf_token");
    if (savedToken) {
      setToken(savedToken);
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Update axios defaults when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("ctf_token", token);
    } else {
      localStorage.removeItem("ctf_token");
    }
  }, [token]);

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const response = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setToken(null);
      setUser(null);
    }
  };

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
    const response = await apiRequest("POST", "/api/admin/login", {
      username,
      password,
    });
    
    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        adminLogin,
        logout,
        refreshUser,
        isLoading,
      }}
    >
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
  const auth = useAuth();
  
  if (!auth.user && !auth.isLoading) {
    throw new Error("Authentication required");
  }
  
  return auth;
}

export function useRequireAdmin() {
  const auth = useAuth();
  
  if (!auth.user?.isAdmin && !auth.isLoading) {
    throw new Error("Admin access required");
  }
  
  return auth;
}
