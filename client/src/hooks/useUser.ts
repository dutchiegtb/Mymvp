import { useQuery } from "@tanstack/react-query";

export interface User {
  id: number;
  email: string;
  username?: string;
  subscriptionTier: string;
  isAdmin?: boolean;
  role?: string;
}

export function useUser() {
  const query = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const token = localStorage.getItem('mvp_token');
      if (!token) return null;
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
