import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Paper,
  Button,
  Group,
  LoadingOverlay,
  Avatar,
  Stack,
  Divider,
} from "@mantine/core";
import {
  IconLogout,
  IconUser,
  IconMail,
  IconShield,
} from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext";

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    } else if (user) {
      setIsLoading(false);
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading || !user) {
    return <LoadingOverlay visible />;
  }

  return (
    <Container size="md" py="xl">
      <Title order={2} mb="lg">
        My Profile
      </Title>

      <Paper withBorder p="xl" radius="md" shadow="sm">
        <Group mb="xl" align="flex-start">
          <Avatar size={80} radius={40} color="blue">
            <IconUser size={40} />
          </Avatar>
          <div>
            <Title order={3}>{user.email}</Title>
            <Text c="dimmed">{user.role}</Text>
          </div>
        </Group>

        <Stack gap="md">
          <Group>
            <IconMail size={20} />
            <Text>{user.email}</Text>
          </Group>

          <Group>
            <IconShield size={20} />
            <Text style={{ textTransform: "capitalize" }}>
              {user.role.toLowerCase()}
            </Text>
          </Group>

          <Divider my="md" />

          <Button
            leftSection={<IconLogout size={18} />}
            variant="outline"
            color="red"
            onClick={handleLogout}
            loading={loading}
          >
            Logout
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
