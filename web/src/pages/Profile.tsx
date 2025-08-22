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
  Badge,
} from "@mantine/core";
import {
  IconLogout,
  IconUser,
  IconMail,
  IconShield,
  IconCalendar,
  IconClock,
  IconId
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
          <Avatar size={100} radius={50} color="blue">
            <IconUser size={50} />
          </Avatar>
          <div>
            <Title order={2} mb="xs">
              {user.fullName || 'No Name Provided'}
            </Title>
            <Text c="dimmed" size="lg">{user.email}</Text>
            <Badge color="blue" variant="light" size="lg" mt={4}>
              {user.role}
            </Badge>
          </div>
        </Group>

        <Stack gap="lg">
          {user.fullName && (
            <Group>
              <IconUser size={20} />
              <Text>{user.fullName}</Text>
            </Group>
          )}

          <Group>
            <IconMail size={20} />
            <Text>{user.email}</Text>
          </Group>

          <Group>
            <IconShield size={20} />
            <Text style={{ textTransform: 'capitalize' }}>
              {user.role.toLowerCase()}
            </Text>
          </Group>

          {user.id && (
            <Group>
              <IconId size={20} />
              <Text size="sm" c="dimmed">
                ID: {user.id}
              </Text>
            </Group>
          )}

          {user.createdAt && (
            <Group>
              <IconCalendar size={20} />
              <Text>
                Member since: {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </Group>
          )}

          {user.updatedAt && (
            <Group>
              <IconClock size={20} />
              <Text>
                Last updated: {new Date(user.updatedAt).toLocaleString()}
              </Text>
            </Group>
          )}

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
