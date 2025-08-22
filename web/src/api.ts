import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:4000";

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: API_BASE,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    withCredentials: true,
  });

  // Add token to requests
  instance.interceptors.request.use((config) => {
    const publicEndpoints = ["/applications", "/api/upload"];
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.startsWith(endpoint)
    );

    if (!isPublicEndpoint) {
      const token = getToken();
      if (token) {
        config.headers = config.headers || new axios.AxiosHeaders();
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  });

  // Handle responses and errors
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<ApiError>) => {
      const publicEndpoints = [
        "/api/applications",
        "/api/upload",
        "/admin/applications",
      ];
      const isPublicEndpoint = publicEndpoints.some((endpoint) =>
        error.config?.url?.startsWith(endpoint)
      );

      if (error.response?.status === 401 && !isPublicEndpoint) {
        setToken(null);
        // Only redirect if in the browser and not already on the login page
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }
      }

      const errorMessage = error.response?.data?.message || "An error occurred";
      const errorStatus = error.response?.status || 500;

      console.error(`API Error (${errorStatus}):`, errorMessage);

      return Promise.reject({
        message: errorMessage,
        status: errorStatus,
        errors: error.response?.data?.errors,
      } as ApiError);
    }
  );

  return instance;
};

// Token management
export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const setToken = (token: string | null): void => {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }
};

const axiosInstance = createAxiosInstance();

export const api = {
  get: <T = any>(url: string, config: AxiosRequestConfig = {}) =>
    axiosInstance.get<T>(url, config).then((res) => res.data),
  post: <T = any>(
    url: string,
    data?: unknown,
    config: AxiosRequestConfig = {}
  ) => axiosInstance.post<T>(url, data, config).then((res) => res.data),
  put: <T = any>(
    url: string,
    data?: unknown,
    config: AxiosRequestConfig = {}
  ) => axiosInstance.put<T>(url, data, config).then((res) => res.data),
  delete: <T = any>(url: string, config: AxiosRequestConfig = {}) =>
    axiosInstance.delete<T>(url, config).then((res) => res.data),

  raw: {
    get: <T = any>(url: string, config: AxiosRequestConfig = {}) =>
      axiosInstance.get<T>(url, config),
    post: <T = any>(
      url: string,
      data?: unknown,
      config: AxiosRequestConfig = {}
    ) => axiosInstance.post<T>(url, data, config),
    put: <T = any>(
      url: string,
      data?: unknown,
      config: AxiosRequestConfig = {}
    ) => axiosInstance.put<T>(url, data, config),
    delete: <T = any>(url: string, config: AxiosRequestConfig = {}) =>
      axiosInstance.delete<T>(url, config),
  },
};

export { axiosInstance };
