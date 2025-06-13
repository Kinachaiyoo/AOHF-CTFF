import { useAuth } from "@/hooks/use-auth";

export function getAuthHeaders() {
  const token = localStorage.getItem("ctf_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("ctf_token");
}

export function isAdmin(): boolean {
  // This should be enhanced to check the actual user role from context
  const auth = useAuth();
  return auth.user?.isAdmin || false;
}
