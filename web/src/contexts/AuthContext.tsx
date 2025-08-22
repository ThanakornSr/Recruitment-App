import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth as useAuthHook } from "../hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Loader, Center } from "@mantine/core";
import { AuthContextType } from "../@types";

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const {
    user,
    loading,
    login: loginFn,
    logout: logoutFn,
    isAdmin,
  } = useAuthHook();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const isPublicPath = ["/", "/login"].includes(window.location.pathname);

        if (token) {
          // If have a token but no user, try to fetch user data
          if (!user && !loading) {
            await queryClient.invalidateQueries({ queryKey: ["user"] });
          }
          // If on the login page, redirect to admin
          if (window.location.pathname === "/login") {
            navigate("/admin");
          }
        } else if (!isPublicPath) {
          // If no token and not on a public page, redirect to login
          navigate("/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // If error, clear the token and redirect to login
        localStorage.removeItem("token");
        if (!["/", "/login"].includes(window.location.pathname)) {
          navigate("/login");
        }
        const isPublicPath = ["/", "/login"].includes(window.location.pathname);
        if (!isPublicPath) {
          navigate("/login");
        }
      } finally {
        setInitialLoading(false);
      }
    };

    checkAuth();
  }, [user, navigate, queryClient]);

  const login = async (email: string, password: string) => {
    try {
      const result = await loginFn({ email, password });
      if (result?.token) {
        navigate(location.state?.from?.pathname || "/admin");
      }
      return result;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutFn();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

  useEffect(() => {
    if (!loading) {
      setInitialLoading(false);
    }
  }, [loading]);

  if (initialLoading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout: logoutFn,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
