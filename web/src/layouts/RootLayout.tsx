import { Outlet } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { Notifications } from "@mantine/notifications";

export function RootLayout() {
  return (
    <AuthProvider>
      <Notifications position="top-right" />
      <Outlet />
    </AuthProvider>
  );
}
