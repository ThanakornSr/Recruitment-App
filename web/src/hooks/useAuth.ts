import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, setToken, getToken } from "../api";
import { User } from "../contexts/AuthContext";

interface LoginResponse {
  user: User;
  token: string;
}

interface UserResponse {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MeResponse {
  success: boolean;
  data: UserResponse;
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
        const response = await api.get<MeResponse>("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const userData = response.data?.data;
        if (!userData) return null;

        return {
          id: userData.id,
          email: userData.email,
          role: userData.role,
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
