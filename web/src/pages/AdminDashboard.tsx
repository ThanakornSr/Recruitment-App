import { useEffect, useState, useContext, useCallback } from "react";
import {
  Table,
  Select,
  Button,
  Group,
  Text,
  Loader,
  Image,
  Box,
  Center,
  Paper,
  Title,
  Anchor,
} from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { useNavigate, Link } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { AuthContext } from "../contexts/AuthContext";
import { api } from "../api";

interface File {
  id: number;
  filePath: string;
  fileType: "PHOTO" | "CV";
  createdAt: string;
}

interface Application {
  id: number;
  fullName: string;
  email: string;
  position: string;
  status: string;
  phone?: string;
  appliedAt: string;
  updatedAt: string;
  isUpdating?: boolean;
  applications: Array<{
    id: number;
    files: File[];
  }>;
}
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';
const FILE_BASE = API_BASE ? API_BASE.replace(/\/api$/, '') : 'http://localhost:3000';

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [rows, setRows] = useState<Application[]>([]);
  const [status, setStatus] = useState<string | null>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (!isAdmin) {
      navigate("/", { replace: true });
      notifications.show({
        title: "Access Denied",
        message: "You do not have permission to access the admin dashboard",
        color: "red",
      });
    }
  }, [user, isAdmin, authLoading, navigate]);

  if (authLoading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="xl" />
      </Center>
    );
  }

  const loadApplications = useCallback(async () => {
    if (!user || !isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await api.raw.get<Application[]>("/admin/applications", {
        params: { status: status || "" },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
      });

      if (response.status === 200) {
        setRows(response.data);
      } else if (response.status === 401) {
        setError("Your session has expired. Please log in again.");
        navigate("/login");
        notifications.show({
          title: "Session Expired",
          message: "Your session has expired. Please log in again.",
          color: "yellow",
        });
      } else if (response.status === 403) {
        setError("You do not have permission to view applications");
        notifications.show({
          title: "Access Denied",
          message: "You do not have permission to view applications",
          color: "red",
        });
      } else {
        const errorMsg =
          response.data &&
          typeof response.data === "object" &&
          "message" in response.data
            ? (response.data as any).message
            : "Failed to load applications";
        setError(`Error: ${errorMsg}`);
        console.error("API Error:", response.status, errorMsg);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMsg);
      console.error("Error in load function:", err);

      notifications.show({
        title: "Error",
        message: errorMsg,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, [status, user, isAdmin, navigate]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  if (loading) {
    return (
      <Paper p="md" radius="md" withBorder>
        <Text ta="center" fw={500} mb="sm">
          Loading Applications
        </Text>
        <Text c="dimmed" size="sm" ta="center">
          Please wait while we load the applications...
        </Text>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper p="md" radius="md" withBorder>
        <Text c="red" fw={500} mb="sm">
          Error Loading Applications
        </Text>
        <Text mb="md">{error}</Text>
        <Button
          onClick={loadApplications}
          variant="light"
          color="blue"
          fullWidth
        >
          Retry
        </Button>
      </Paper>
    );
  }

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "WAIT_RESULT", label: "Wait for Result" },
    { value: "PASS_INTERVIEW", label: "Passed Interview" },
    { value: "REJECT_INTERVIEW", label: "Rejected from Interview" },
    { value: "REJECT", label: "Rejected" },
  ];

  const handleStatusUpdate = async (row: Application, newStatus: string) => {
    if (!newStatus) return;

    const previousStatus = row.status;

    setRows((prevRows) =>
      prevRows.map((r) =>
        r.id === row.id ? { ...r, status: newStatus, isUpdating: true } : r
      )
    );

    try {
      let response;

      if (newStatus === "WAIT_RESULT") {
        response = await api.put(`/admin/applications/${row.id}/approve`, {
          interviewDate: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // Default to 7 days from now
          notes: `Application approved and interview scheduled`,
        });
      } else if (newStatus === "REJECT") {
        // For rejecting an application
        response = await api.put(`/admin/applications/${row.id}/reject`, {
          notes: `Application rejected`,
        });
      } else if (["PASS_INTERVIEW", "REJECT_INTERVIEW"].includes(newStatus)) {
        // For recording interview results
        response = await api.put(
          `/admin/applications/${row.id}/interview-result`,
          {
            result: newStatus,
            feedback:
              newStatus === "PASS_INTERVIEW"
                ? "Candidate has passed the interview"
                : "Candidate did not pass the interview",
          }
        );
      } else {
        // Fallback to the old status update endpoint
        response = await api.put(`/admin/applications/${row.id}/status`, {
          status: newStatus,
        });
      }

      setRows((prevRows) =>
        prevRows.map((r) =>
          r.id === row.id
            ? {
                ...r,
                status: newStatus,
                isUpdating: false,
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );

      notifications.show({
        title: "Success",
        message: `Status updated to ${
          statusOptions.find((opt) => opt.value === newStatus)?.label ||
          newStatus
        }`,
        color: "green",
      });
    } catch (err) {
      console.error("Failed to update status:", err);

      // Revert the status in the UI if the update fails
      setRows((prevRows) =>
        prevRows.map((r) =>
          r.id === row.id
            ? {
                ...r,
                status: previousStatus,
                isUpdating: false,
              }
            : r
        )
      );

      const errorMessage =
        err?.response?.data?.message || "Failed to update application status";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={3}>Applications</Title>
        <Select
          placeholder="Filter status"
          data={statusOptions}
          value={status}
          onChange={setStatus}
          clearable
          style={{ width: 250 }}
        />
      </Group>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Photo</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Position</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Applied At</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.id}>
              <Table.Td>
                {(() => {
                  const photoFile = row.applications[0]?.files?.find(
                    (f) => f.fileType === "PHOTO"
                  );
                  if (!photoFile) {
                    return (
                      <Box
                        style={{
                          width: 120,
                          height: 120,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#f5f5f5",
                          borderRadius: "8px",
                        }}
                      >
                        <Text size="sm" c="dimmed">
                          No photo
                        </Text>
                      </Box>
                    );
                  }

                  return (
                    <Image
                      src={`${FILE_BASE}/uploads/${encodeURIComponent(
                        photoFile.filePath
                      )}`}
                      width={"auto"}
                      height={120}
                      radius="md"
                      fit="contain"
                      alt={`${row.fullName}'s photo`}
                      fallbackSrc="https://placehold.co/120x120?text=Photo+Not+Found"
                      onError={(e) => {
                        console.error("Error loading image:", e);
                        console.log(
                          "Tried to load from:",
                          `${FILE_BASE}/uploads/${photoFile.filePath}`
                        );
                      }}
                    />
                  );
                })()}
              </Table.Td>
              <Table.Td>
                <Group>
                  <div>
                    <Text fw={500}>{row.fullName}</Text>
                    <Text size="sm" c="dimmed">
                      {row.email}
                    </Text>
                  </div>
                </Group>
              </Table.Td>
              <Table.Td>{row.position}</Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <Select
                    value={row.status}
                    data={statusOptions.filter((opt) => opt.value !== "")}
                    onChange={(value) =>
                      value && handleStatusUpdate(row, value)
                    }
                    variant="unstyled"
                    style={{ minWidth: "150px" }}
                    disabled={row.isUpdating}
                  />
                  {row.isUpdating && <Loader size="xs" />}
                </Group>
              </Table.Td>
              <Table.Td>
                {new Date(row.appliedAt).toLocaleDateString()}
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  {/* <Button
                    component={Link}
                    to={`/admin/applications/${row.id}`}
                    size="xs"
                    variant="light"
                  >
                    View
                  </Button> */}
                  <Button
                    variant="light"
                    size="xs"
                    component="a"
                    href={`${FILE_BASE}/uploads/${
                      row.applications[0]?.files?.find(
                        (f) => f.fileType === "CV"
                      )?.filePath || ""
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    leftSection={<IconDownload size={14} />}
                    disabled={
                      !row.applications[0]?.files?.some(
                        (f) => f.fileType === "CV"
                      )
                    }
                  >
                    Download CV
                  </Button>
                  <Button
                    size="xs"
                    color="red"
                    variant="light"
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this application?"
                        )
                      ) {
                        try {
                          await api.delete(`/admin/applications/${row.id}`);
                          loadApplications();
                          notifications.show({
                            title: "Success",
                            message: "Application deleted successfully",
                            color: "green",
                          });
                        } catch (err) {
                          console.error("Failed to delete application:", err);
                          notifications.show({
                            title: "Error",
                            message: "Failed to delete application",
                            color: "red",
                          });
                        }
                      }
                    }}
                  >
                    Delete
                  </Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
