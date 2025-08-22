import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, API_BASE } from "../api";
import {
  Button,
  Group,
  Textarea,
  Title,
  Stack,
  TextInput,
  Paper,
  Text,
  Avatar,
  Badge,
  Divider,
  LoadingOverlay,
  Alert,
  Tabs,
  SimpleGrid,
  Anchor,
  Box,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconFileDescription,
  IconMail,
  IconPhone,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "blue",
  WAIT_RESULT: "yellow",
  PASS_INTERVIEW: "green",
  REJECT_INTERVIEW: "red",
  REJECT: "red",
  APPROVED: "green",
};

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [interviewAt, setInterviewAt] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>("details");

  const {
    data: application,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["application", id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/applications/${id}`);
      setNotes(data.notes || "");
      setInterviewAt(data.interviewAt || "");
      return data;
    },
  });

  const handleApiCall = async (
    apiCall: () => Promise<any>,
    successMessage: string
  ) => {
    try {
      await apiCall();
      await refetch();
      notifications.show({
        title: "Success",
        message: successMessage,
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "An error occurred. Please try again.",
        color: "red",
      });
    }
  };

  const handleApprove = () =>
    handleApiCall(
      () => api.put(`/admin/applications/${id}/approve`, { notes }),
      "Application approved successfully!"
    );

  const handleReject = () =>
    handleApiCall(
      () => api.put(`/admin/applications/${id}/reject`, { notes }),
      "Application rejected."
    );

  const handleSchedule = () =>
    handleApiCall(
      () =>
        api.put(`/admin/applications/${id}/schedule`, { interviewAt, notes }),
      "Interview scheduled successfully!"
    );

  const handleInterviewResult = (result: "pass" | "fail") =>
    handleApiCall(
      () =>
        api.put(`/admin/applications/${id}/interview-result`, {
          result,
          notes,
        }),
      `Interview marked as ${result === "pass" ? "PASS" : "FAIL"}`
    );

  const getStatusBadge = (status: string) => (
    <Badge color={STATUS_COLORS[status] || "gray"} variant="light">
      {status.replace(/_/g, " ")}
    </Badge>
  );

  if (isLoading) {
    return <LoadingOverlay visible={isLoading} />;
  }

  if (error || !application) {
    return (
      <Alert color="red" title="Error loading application">
        Could not load application details. Please try again.
      </Alert>
    );
  }

  const {
    fullName,
    email,
    phone,
    position,
    status,
    appliedAt,
    updatedAt,
    interviewAt: interviewTime,
    photoPath,
    cvPath,
    applications = [],
  } = application;

  const formattedAppliedAt = dayjs(appliedAt).format("MMM D, YYYY h:mm A");
  const formattedUpdatedAt = dayjs(updatedAt).format("MMM D, YYYY h:mm A");
  const formattedInterviewAt = interviewTime
    ? dayjs(interviewTime).format("MMM D, YYYY h:mm A")
    : "Not scheduled";

  return (
    <Stack spacing="md">
      <Group position="apart" align="flex-start">
        <Group spacing="sm">
          <ActionIcon onClick={() => navigate(-1)}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Group spacing="xs" align="center">
              <Title order={3}>{fullName}</Title>
              {getStatusBadge(status)}
            </Group>
            <Text size="sm" color="dimmed">
              Applied on {formattedAppliedAt}
            </Text>
          </div>
        </Group>
        <Group>
          <Button
            leftIcon={<IconCheck size={16} />}
            onClick={handleApprove}
            color="green"
            size="sm"
          >
            Approve
          </Button>
          <Button
            leftIcon={<IconX size={16} />}
            onClick={handleReject}
            color="red"
            variant="outline"
            size="sm"
          >
            Reject
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onTabChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="details" icon={<IconUser size={14} />}>
            Details
          </Tabs.Tab>
          <Tabs.Tab value="interview" icon={<IconCalendar size={14} />}>
            Interview
          </Tabs.Tab>
          <Tabs.Tab value="documents" icon={<IconFileDescription size={14} />}>
            Documents
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="md">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Paper p="md" withBorder>
              <Text size="sm" color="dimmed" mb="md">
                Personal Information
              </Text>
              <Stack spacing="xs">
                <Group noWrap>
                  <IconUser size={18} color="gray" />
                  <Text>{fullName}</Text>
                </Group>
                <Group noWrap>
                  <IconMail size={18} color="gray" />
                  <Anchor href={`mailto:${email}`} target="_blank">
                    {email}
                  </Anchor>
                </Group>
                {phone && (
                  <Group noWrap>
                    <IconPhone size={18} color="gray" />
                    <Anchor href={`tel:${phone}`}>{phone}</Anchor>
                  </Group>
                )}
              </Stack>
            </Paper>

            <Paper p="md" withBorder>
              <Text size="sm" color="dimmed" mb="md">
                Application Details
              </Text>
              <Stack spacing="xs">
                <Group position="apart">
                  <Text size="sm">Position</Text>
                  <Text weight={500}>{position}</Text>
                </Group>
                <Group position="apart">
                  <Text size="sm">Status</Text>
                  {getStatusBadge(status)}
                </Group>
                <Group position="apart">
                  <Text size="sm">Applied On</Text>
                  <Text>{formattedAppliedAt}</Text>
                </Group>
                <Group position="apart">
                  <Text size="sm">Last Updated</Text>
                  <Text>{formattedUpdatedAt}</Text>
                </Group>
              </Stack>
            </Paper>
          </SimpleGrid>

          <Paper p="md" withBorder mt="md">
            <Text size="sm" color="dimmed" mb="md">
              Application Notes
            </Text>
            <Textarea
              placeholder="Add notes about this application..."
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
              minRows={4}
            />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="interview" pt="md">
          <Paper p="md" withBorder>
            <Text size="sm" color="dimmed" mb="md">
              Interview Schedule
            </Text>
            <Stack spacing="md">
              <Group position="apart">
                <Text>Interview Scheduled</Text>
                <Text weight={500}>
                  {interviewTime ? formattedInterviewAt : "Not scheduled"}
                </Text>
              </Group>

              <Group grow>
                <TextInput
                  type="datetime-local"
                  label="Schedule Interview"
                  value={interviewAt}
                  onChange={(e) => setInterviewAt(e.currentTarget.value)}
                />
                <Button
                  onClick={handleSchedule}
                  leftIcon={<IconCalendar size={16} />}
                  mt={24}
                >
                  Schedule
                </Button>
              </Group>

              <Divider my="sm" />

              <Group position="center">
                <Button
                  color="green"
                  leftIcon={<IconCheck size={16} />}
                  onClick={() => handleInterviewResult("pass")}
                >
                  Mark as Passed
                </Button>
                <Button
                  color="red"
                  variant="outline"
                  leftIcon={<IconX size={16} />}
                  onClick={() => handleInterviewResult("fail")}
                >
                  Mark as Failed
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="documents" pt="md">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Paper p="md" withBorder>
              <Text size="sm" color="dimmed" mb="md">
                Photo
              </Text>
              {photoPath ? (
                <Box sx={{ maxWidth: 200, margin: "0 auto" }}>
                  <Avatar
                    src={`${API_BASE}${photoPath}`}
                    size={200}
                    radius="sm"
                    alt={fullName}
                  />
                </Box>
              ) : (
                <Text color="dimmed" size="sm" align="center" py="md">
                  No photo uploaded
                </Text>
              )}
            </Paper>

            <Paper p="md" withBorder>
              <Text size="sm" color="dimmed" mb="md">
                Resume / CV
              </Text>
              {cvPath ? (
                <Button
                  component="a"
                  href={`${API_BASE}/admin/applications/${id}/cv`}
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<IconFileDescription size={16} />}
                  fullWidth
                >
                  Download CV
                </Button>
              ) : (
                <Text color="dimmed" size="sm" align="center" py="md">
                  No CV uploaded
                </Text>
              )}
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
