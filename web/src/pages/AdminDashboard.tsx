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
  Modal,
  SegmentedControl,
  Textarea,
  Badge,
  Menu,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { api } from "../api";
import { IconChevronDown } from "@tabler/icons-react";

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

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
const FILE_BASE = API_BASE.replace(/\/api$/, "") || "http://localhost:4000";

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "yellow";
    case "WAIT_RESULT":
      return "blue";
    case "PASS_INTERVIEW":
      return "green";
    case "REJECT_INTERVIEW":
    case "REJECT":
      return "red";
    default:
      return "gray";
  }
};

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [rows, setRows] = useState<Application[]>([]);
  const [status, setStatus] = useState<string | null>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<
    "AWAIT_INTERVIEW" | "AWAIT_RESULT" | "OUTCOME"
  >("AWAIT_INTERVIEW");
  const [opened, setOpened] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [interviewDate, setInterviewDate] = useState<Date | null>(new Date());
  const [interviewNotes, setInterviewNotes] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login", { replace: true });
      } else if (!isAdmin) {
        navigate("/", { replace: true });
        notifications.show({
          title: "Access Denied",
          message: "You do not have permission to access the admin dashboard",
          color: "red",
        });
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadApplications = useCallback(async () => {
    if (!user || !isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await api.raw.get<Application[]>("/admin/applications", {
        params: { status: status || "" },
        headers: { Authorization: `Bearer ${token}` },
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
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMsg);
      notifications.show({ title: "Error", message: errorMsg, color: "red" });
    } finally {
      setLoading(false);
    }
  }, [status, user, isAdmin, navigate]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filteredRows = rows.filter((row) => {
    switch (tab) {
      case "AWAIT_INTERVIEW":
        return row.status === "PENDING";
      case "AWAIT_RESULT":
        return row.status === "WAIT_RESULT";
      case "OUTCOME":
        return ["PASS_INTERVIEW", "REJECT_INTERVIEW", "REJECT"].includes(
          row.status
        );
      default:
        return true;
    }
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "WAIT_RESULT":
        return "Awaiting Result";
      case "PASS_INTERVIEW":
        return "Passed Interview";
      case "REJECT_INTERVIEW":
        return "Rejected from Interview";
      case "REJECT":
        return "Rejected";
      default:
        return status;
    }
  };

  const getFilePath = (row: Application, type: "PHOTO" | "CV") => {
    const file = row.applications?.[0]?.files?.find((f) => f.fileType === type);
    return file ? file.filePath : "";
  };

  const handleOpenInterview = (row: Application) => {
    setSelectedApplication(row);
    setOpened(true);
  };

  const handleScheduleInterview = async () => {
    if (!selectedApplication || !interviewDate) return;

    try {
      await handleStatusUpdate(selectedApplication, "WAIT_RESULT");
      notifications.show({
        title: "Interview Scheduled",
        message: `Interview scheduled on ${interviewDate.toLocaleDateString()}`,
        color: "green",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setOpened(false);
      setSelectedApplication(null);
      setInterviewNotes("");
      setInterviewDate(new Date());
    }
  };

  const handleStatusUpdate = async (row: Application, newStatus: string) => {
    if (!newStatus) return;
    const previousStatus = row.status;

    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, status: newStatus, isUpdating: true } : r
      )
    );

    try {
      let response;
      if (newStatus === "WAIT_RESULT") {
        response = await api.put(`/admin/applications/${row.id}/approve`, {
          interviewDate: interviewDate?.toISOString(),
          notes:
            interviewNotes || "Application approved and interview scheduled",
        });
      } else if (newStatus === "REJECT") {
        response = await api.put(`/admin/applications/${row.id}/reject`, {
          notes: "Application rejected",
        });
      } else if (["PASS_INTERVIEW", "REJECT_INTERVIEW"].includes(newStatus)) {
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
        response = await api.put(`/admin/applications/${row.id}/status`, {
          status: newStatus,
        });
      }

      setRows((prev) =>
        prev.map((r) =>
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
        message: `Status updated to ${getStatusLabel(newStatus)}`,
        color: "green",
      });
    } catch (err) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, status: previousStatus, isUpdating: false }
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

  const handleStatusChange = (row: Application, newStatus: string) => {
    if (newStatus === "WAIT_RESULT") {
      setSelectedApplication(row);
      setOpened(true);
    } else {
      handleStatusUpdate(row, newStatus);
    }
  };
  if (authLoading || loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="xl" />
      </Center>
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

  return (
    <Group
      align="flex-start"
      flex={1}
      style={{ width: "100%", minHeight: "100vh", padding: 16 }}
    >
      <Paper
        withBorder
        p="md"
        radius="md"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "80vh",
        }}
      >
        <Title order={4} mb="sm">
          Dashboard
        </Title>

        <SegmentedControl
          value={tab}
          onChange={setTab}
          data={[
            { label: "Awaiting Interview", value: "AWAIT_INTERVIEW" },
            { label: "Awaiting Result", value: "AWAIT_RESULT" },
            { label: "Outcome", value: "OUTCOME" },
          ]}
          fullWidth
          mb="md"
        />

        {filteredRows.length === 0 ? (
          <Center style={{ flex: 1 }}>
            <Text c="dimmed" size="md">
              No applications found for this tab.
            </Text>
          </Center>
        ) : (
          <Box style={{ flex: 1, overflowX: "auto" }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Position Applied For</Table.Th>
                  <Table.Th>Application Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Photo</Table.Th>
                  <Table.Th>CV</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {filteredRows.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{row.fullName}</Table.Td>
                    <Table.Td>{row.position}</Table.Td>
                    <Table.Td>
                      {new Date(row.appliedAt).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td>
                      <Group spacing="xs">
                        <Badge
                          color={getStatusColor(row.status)}
                          variant="filled"
                        >
                          {getStatusLabel(row.status)}
                        </Badge>

                        <Menu shadow="sm" withArrow>
                          <Menu.Target>
                            <Button
                              size="xs"
                              rightIcon={<IconChevronDown size={14} />}
                            >
                              Change
                            </Button>
                          </Menu.Target>

                          <Menu.Dropdown>
                            {[
                              "PENDING",
                              "WAIT_RESULT",
                              "PASS_INTERVIEW",
                              "REJECT_INTERVIEW",
                              "REJECT",
                            ].map(
                              (statusOption) =>
                                statusOption !== row.status && (
                                  <Menu.Item
                                    key={statusOption}
                                    color={getStatusColor(statusOption)}
                                    onClick={() =>
                                      handleStatusChange(row, statusOption)
                                    }
                                  >
                                    {getStatusLabel(statusOption)}
                                  </Menu.Item>
                                )
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      {getFilePath(row, "PHOTO") ? (
                        <Anchor
                          href={`${FILE_BASE}/${getFilePath(row, "PHOTO")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Photo
                        </Anchor>
                      ) : (
                        <Text c="dimmed">No Photo</Text>
                      )}
                    </Table.Td>

                    <Table.Td>
                      {getFilePath(row, "CV") ? (
                        <Anchor
                          href={`${FILE_BASE}/${getFilePath(row, "CV")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View CV
                        </Anchor>
                      ) : (
                        <Text c="dimmed">No CV</Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* Interview Modal */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Schedule Interview"
        size="sm"
      >
        <DateInput
          label="Interview Date"
          value={interviewDate}
          onChange={setInterviewDate}
          minDate={new Date()}
          required
          mb="md"
        />
        <Textarea
          label="Note"
          value={interviewNotes}
          onChange={(e) => setInterviewNotes(e.currentTarget.value)}
          minRows={3}
          mb="md"
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (selectedApplication) {
                await handleStatusUpdate(selectedApplication, "WAIT_RESULT");
                setOpened(false);
                setSelectedApplication(null);
                setInterviewNotes("");
                setInterviewDate(new Date());
              }
            }}
          >
            Save
          </Button>
        </Group>
      </Modal>
    </Group>
  );
}
