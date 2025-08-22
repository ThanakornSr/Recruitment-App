import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, setToken, getToken } from "../api";

interface LoginResponse {
  user: User;
  token: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface UserData {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const useAuth = () => {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isFetching,
  } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: async (): Promise<User | null> => {
      const token = getToken();
      if (!token) return null;

      try {
        const response = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.data?.success || !response.data?.data) return null;

        const { id, email, role, fullName, createdAt, updatedAt } =
          response.data.data;
        return {
          id,
          email,
          role,
          fullName,
          createdAt,
          updatedAt,
        };
      } catch (error) {
        setToken(null);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const loading = isLoading || isFetching;

  const login = useMutation<
    LoginResponse,
    Error,
    { email: string; password: string }
  >({
    mutationFn: async (credentials) => {
      const response = await api.post<LoginResponse>(
        "/auth/login",
        credentials
      );
      if (!response?.user || !response?.token) {
        throw new Error("Invalid response from server");
      }
      return response;
    },
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(["user"], data.user);
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      try {
        await api.post("/auth/logout");
      } catch (error) {
        console.error("Logout error:", error);
      }
    },
    onSuccess: () => {
      setToken(null);
      queryClient.setQueryData(["user"], null);
      queryClient.clear();
    },
  });

  return {
    user: user || null,
    loading: loading || login.isPending,
    login: login.mutateAsync,
    logout: logout.mutate,
    isAdmin: user?.role === "ADMIN",
  };
};
