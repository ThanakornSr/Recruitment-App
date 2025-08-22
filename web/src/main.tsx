import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ModalsProvider } from "@mantine/modals";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { RootLayout } from "./components/RootLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import App from "./App";
import Login from "./pages/Login";
import PublicApply from "./pages/PublicApply";
import AdminDashboard from "./pages/AdminDashboard";
import ApplicationDetail from "./pages/ApplicationDetail";
import Profile from "./pages/Profile";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

const theme = createTheme({
  fontFamily: "Inter, sans-serif",
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <PublicApply /> },
      { path: "login", element: <Login /> },
      {
        path: "admin",
        element: (
          <ProtectedRoute requireAdmin>
            <App />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "applications/:id", element: <ApplicationDetail /> },
          { path: "profile", element: <Profile /> },
        ],
      },
    ],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <ModalsProvider>
          <RouterProvider router={router} />
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
