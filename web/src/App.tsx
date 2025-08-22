import { Outlet } from "react-router-dom";
import { RootLayout } from "./components/RootLayout";
import "@mantine/dates/styles.css";

export default function App() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  );
}
