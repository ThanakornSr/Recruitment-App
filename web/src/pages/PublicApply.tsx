import { useState } from "react";
import {
  TextInput,
  Button,
  Paper,
  Stack,
  Title,
  FileInput,
  Select,
  Text,
  Group,
  Box,
  Loader,
  Center,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { notifications } from "@mantine/notifications";

const POSITIONS = [
  { value: "Software Engineer", label: "Software Engineer" },
  { value: "Frontend Developer", label: "Frontend Developer" },
  { value: "Backend Developer", label: "Backend Developer" },
  { value: "Full Stack Developer", label: "Full Stack Developer" },
  { value: "DevOps Engineer", label: "DevOps Engineer" },
  { value: "UI/UX Designer", label: "UI/UX Designer" },
];

export default function PublicApply() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    dateOfBirth: null as Date | null,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | Date | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitApplication = useMutation({
    mutationFn: async () => {
      const formDataToSend = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formDataToSend.append(key, value.toString());
        }
      });

      if (photo) {
        formDataToSend.append("photo", photo);
      }
      if (cv) {
        formDataToSend.append("cv", cv);
      }

      const response = await api.post("/applications/submit", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    },
    onSuccess: (data) => {
      notifications.show({
        title: "Success!",
        message: "Your application has been submitted successfully.",
        color: "green",
      });
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        position: "",
        dateOfBirth: null,
      });
      setPhoto(null);
      setCv(null);

      // Redirect to thank you page or home
      // setTimeout(() => {
      //   navigate("/thank-you");
      // }, 2000);
    },
    onError: (error: any) => {
      console.error("Error submitting application:", error);
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.message ||
          "Failed to submit application. Please try again.",
        color: "red",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.position || !cv) {
      notifications.show({
        title: "Missing Information",
        message: "Please fill in all required fields and upload your CV.",
        color: "yellow",
      });
      return;
    }

    submitApplication.mutate();
  };

  if (submitApplication.isPending) {
    return (
      <Center style={{ height: "60vh" }}>
        <Box>
          <Loader size="xl" />
          <Text mt="md" ta="center">
            Submitting your application...
          </Text>
        </Box>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Paper p="xl" radius="md" withBorder style={{ maxWidth: 800 }} mx="auto">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Title order={2}>Job Application</Title>
            <Text c="dimmed" mb="md">
              Please fill out the form below to apply for the position. Fields
              marked with * are required.
            </Text>

            <TextInput
              label="Full Name *"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              required
              placeholder="John Doe"
            />

            <TextInput
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
              placeholder="john.doe@example.com"
            />

            <TextInput
              label="Phone (Optional)"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+1234567890"
            />
            <DateInput
              label="Date of Birth (Optional)"
              value={formData.dateOfBirth}
              onChange={(value) => handleInputChange("dateOfBirth", value)}
              placeholder="Select date"
              maxDate={new Date()}
              valueFormat="YYYY-MM-DD"
            />
            <Select
              label="Position *"
              placeholder="Select a position"
              data={POSITIONS}
              value={formData.position}
              onChange={(value) => handleInputChange("position", value || "")}
              searchable
              required
            />

            <FileInput
              label="Upload Photo (Optional, Max 2MB)"
              value={photo}
              onChange={setPhoto}
              accept="image/*"
              placeholder="Click to upload"
            />

            <FileInput
              label="Upload CV (Required, PDF only, Max 5MB) *"
              value={cv}
              onChange={setCv}
              accept=".pdf"
              required
              placeholder="Click to upload"
            />

            <Button
              type="submit"
              size="lg"
              loading={submitApplication.isPending}
              mt="md"
            >
              Submit Application
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
