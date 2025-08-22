import { AppShell, Avatar, Button, Group, Menu, Text } from "@mantine/core";
import "@mantine/dates/styles.css";
import { IconLogout, IconUser } from "@tabler/icons-react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
      style={{
        main: {
          backgroundColor: "var(--mantine-color-gray-0)",
          "@media (prefers-color-scheme: dark)": {
            backgroundColor: "var(--mantine-color-dark-8)",
          },
        },
      }}
    >
      <AppShell.Header>
        <Group px="md" h="100%" justify="space-between">
          <Text fw={700} size="lg">
            Recruitment Admin
          </Text>

          {user && (
            <Group>
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button variant="subtle" px="xs">
                    <Group gap={7}>
                      <Avatar
                        src={null}
                        alt={user.email}
                        radius="xl"
                        size={30}
                        color="blue"
                      >
                        {user.email.charAt(0).toUpperCase()}
                      </Avatar>
                      <Text size="sm" fw={500}>
                        {user.email}
                      </Text>
                    </Group>
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Account</Menu.Label>
                  <Menu.Item
                    leftSection={<IconUser size={14} />}
                    onClick={() => navigate("/admin/profile")}
                  >
                    Profile
                  </Menu.Item>

                  <Menu.Divider />

                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={14} />}
                    onClick={handleLogout}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
