import { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Stack,
  Title,
  Text,
  Box,
  Group,
} from "@mantine/core";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { IconArrowLeft } from "@tabler/icons-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    }
  };

  return (
    <>
      <Button
        component={Link}
        to="/"
        m="md"
        variant="outline"
        leftSection={<IconArrowLeft size={16} />}
        style={{ position: "absolute" }}
      >
        Job Application
      </Button>
      <Box
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper maw={420} w="100%" mx="md" p="xl" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack>
              <Title order={2} ta="center">
                Admin Portal
              </Title>
              <Text c="dimmed" size="sm" ta="center" mt={5}>
                Enter your credentials to access the dashboard
              </Text>

              {error && (
                <Text c="red" size="sm">
                  {error}
                </Text>
              )}

              <TextInput
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                disabled={loading}
              />

              <PasswordInput
                label="Password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />

              <Button type="submit" loading={loading} fullWidth mt="md">
                Sign in
              </Button>

              <Text c="dimmed" size="xs" ta="center" mt="md">
                Forgot your password?{" "}
                <Text component={Link} c="blue" td="underline">
                  Reset it here
                </Text>
              </Text>
            </Stack>
          </form>
        </Paper>
      </Box>
    </>
  );
}
