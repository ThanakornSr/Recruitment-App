import {
  Anchor,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Menu,
  Modal,
  Paper,
  SegmentedControl,
  Table,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconChevronDown } from "@tabler/icons-react";
import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { AuthContext } from "../contexts/AuthContext";

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
const FILE_BASE = API_BASE.replace(/\/api$/, "");

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // State
  const [rows, setRows] = useState<Application[]>([]);
  const [status, setStatus] = useState<string | null>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("AWAIT_INTERVIEW");

  const [opened, setOpened] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [interviewDate, setInterviewDate] = useState<Date | null>(new Date());
  const [interviewNotes, setInterviewNotes] = useState("");

  // Auth redirect
  useEffect(() => {
    if (authLoading) return;

    if (!user) navigate("/login", { replace: true });
    if (!isAdmin) {
      navigate("/", { replace: true });
      notifications.show({
        title: "Access Denied",
        message: "You do not have permission to access the admin dashboard",
        color: "red",
      });
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Load applications
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
      } else {
        setError("Failed to load applications");
        notifications.show({
          title: "Error",
          message: "Failed to load applications",
          color: "red",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      notifications.show({ title: "Error", message: msg, color: "red" });
    } finally {
      setLoading(false);
    }
  }, [status, user, isAdmin]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Helpers
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "WAIT_RESULT":
        return "Awaiting Result";
      case "PASS_INTERVIEW":
        return "Passed Interview";
      case "REJECT_INTERVIEW":
        return "Rejected Interview";
      case "REJECT":
        return "Rejected";
      default:
        return status;
    }
  };

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

  const getFilePath = (row: Application, type: "PHOTO" | "CV") => {
    const file = row.applications?.[0]?.files?.find((f) => f.fileType === type);
    return file?.filePath || "";
  };

  // Handle status update
  const handleStatusUpdate = async (
    row: Application,
    newStatus: string,
    interviewDateParam?: Date | null,
    notes?: string
  ) => {
    const previousStatus = row.status;
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, status: newStatus, isUpdating: true } : r
      )
    );

    try {
      if (newStatus === "WAIT_RESULT" && interviewDateParam) {
        await api.put(`/admin/applications/${row.id}/approve`, {
          interviewDate: interviewDateParam.toISOString(),
          notes: notes || "Interview scheduled",
        });
      } else if (newStatus === "REJECT") {
        await api.put(`/admin/applications/${row.id}/reject`, {
          notes: notes || "Application rejected",
        });
      } else if (["PASS_INTERVIEW", "REJECT_INTERVIEW"].includes(newStatus)) {
        await api.put(`/admin/applications/${row.id}/interview-result`, {
          result: newStatus,
          feedback:
            newStatus === "PASS_INTERVIEW"
              ? "Candidate passed"
              : "Candidate failed",
        });
      } else {
        await api.put(`/admin/applications/${row.id}/status`, {
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
      const msg =
        err?.response?.data?.message || "Failed to update application status";
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
  };

  const handleStatusChange = (row: Application, newStatus: string) => {
    if (newStatus === "SCHEDULE_INTERVIEW") {
      setSelectedApplication(row);
      setOpened(true);
    } else {
      handleStatusUpdate(row, newStatus);
    }
  };

  const filteredRows = rows.filter((r) => {
    switch (tab) {
      case "AWAIT_INTERVIEW":
        return r.status === "PENDING";
      case "AWAIT_RESULT":
        return r.status === "WAIT_RESULT";
      case "OUTCOME":
        return ["PASS_INTERVIEW", "REJECT_INTERVIEW", "REJECT"].includes(
          r.status
        );
      default:
        return true;
    }
  });

  return (
    <Group
      flex={1}
      align="flex-start"
      justify="center"
      grow
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

        {loading ? (
          <Center style={{ flex: 1 }}>
            <Loader />
          </Center>
        ) : filteredRows.length === 0 ? (
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
                  <Table.Th>Position</Table.Th>
                  <Table.Th>Applied At</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Photo</Table.Th>
                  <Table.Th>CV</Table.Th>
                  <Table.Th>Actions</Table.Th>
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
                      <Badge
                        color={getStatusColor(row.status)}
                        variant="filled"
                      >
                        {getStatusLabel(row.status)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {getFilePath(row, "PHOTO") ? (
                        <Anchor
                          href={`${FILE_BASE}/uploads/${getFilePath(
                            row,
                            "PHOTO"
                          )}`}
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
                          href={`${FILE_BASE}/uploads/${getFilePath(
                            row,
                            "CV"
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View CV
                        </Anchor>
                      ) : (
                        <Text c="dimmed">No CV</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group spacing="xs">
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
                            {row.status !== "WAIT_RESULT" &&
                              row.status !== "PASS_INTERVIEW" &&
                              row.status !== "REJECT_INTERVIEW" &&
                              row.status !== "REJECT" && (
                                <Menu.Item
                                  color="blue"
                                  onClick={() =>
                                    handleStatusChange(
                                      row,
                                      "SCHEDULE_INTERVIEW"
                                    )
                                  }
                                >
                                  Schedule Interview
                                </Menu.Item>
                              )}

                            {[
                              "PENDING",
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
              if (selectedApplication && interviewDate) {
                await handleStatusUpdate(
                  selectedApplication,
                  "WAIT_RESULT",
                  interviewDate,
                  interviewNotes
                );
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
