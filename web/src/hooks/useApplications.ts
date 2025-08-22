import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

// Type definitions matching Prisma schema
export type ApplicationStatus =
  | "PENDING"
  | "INTERVIEW_SCHEDULED"
  | "PASSED_INTERVIEW"
  | "REJECTED_INTERVIEW"
  | "APPROVED"
  | "REJECTED";

export type FileType = "PHOTO" | "CV";

export type File = {
  id: number;
  filePath: string;
  fileType: FileType;
  applicationId: number;
  uploaderId?: number;
  createdAt: string;
};

export type Application = {
  id: number;
  applicantId: number;
  status: ApplicationStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  files: File[];
  applicant: Applicant;
};

export type Applicant = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  position: string;
  dateOfBirth: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  updatedBy: string | null;
  createdById: number | null;
  applications: Application[];
  createdBy?: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

export interface ApplicationWithFiles {
  id: number;
  status: ApplicationStatus;
  notes?: string | null;
  interviewAt?: string | null;
  applicant: Omit<Applicant, "applications"> & {
    fullName: string;
    email: string;
    phone: string | null;
    position: string;
    dateOfBirth: string | null;
    status: ApplicationStatus;
    appliedAt: string;
    updatedAt: string;
    updatedBy: string | null;
    createdById: number | null;
  };
  files: Array<{
    id: number;
    filePath: string;
    fileType: "CV" | "PHOTO" | "OTHER";
    applicationId: number;
    uploaderId?: number;
    createdAt: string;
  }>;
  photoPath?: string;
  cvPath?: string;
  updatedAt: string;
  createdAt: string;
  applicantId: number;
}

export type UIApplication = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  position: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  files: File[];
  applicationId: number;
  notes?: string | null;
  interviewDate?: string | null;
};

type ApiResponse<T> = BaseApiResponse<T>;

interface BaseApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

interface ApplicationsResponse {
  data: ApplicationWithFiles[];
  message?: string;
  success?: boolean;
}

interface ApplicationResponse {
  data: ApplicationWithFiles;
  message?: string;
  success?: boolean;
}

interface UpdateApplicationData {
  id: string;
  status?: ApplicationStatus;
  notes?: string | null;
  interviewAt?: string | null;
}

export const useApplications = (status?: ApplicationStatus) => {
  return useQuery<ApplicationWithFiles[]>({
    queryKey: status ? ["applications", status] : ["applications"],
    queryFn: async () => {
      const response = await api.get<ApplicationsResponse>(
        "/admin/applications",
        { params: status ? { status } : {} }
      );

      if (!response.data) {
        throw new Error("Invalid response format from server");
      }

      return response.data.map((app) => ({
        ...app,
        id: app.id,
        status: app.status,
        notes: app.notes,
        interviewAt: app.interviewAt,
        applicant: app.applicant,
        files: app.files,
        photoPath: app.photoPath,
        cvPath: app.cvPath,
        updatedAt: app.updatedAt,
        createdAt: app.createdAt,
      }));
    },
    keepPreviousData: true,
  } as any); // Type assertion to handle keepPreviousData type issue
};

export const useApplication = (id: string) => {
  return useQuery<ApplicationWithFiles>({
    queryKey: ["application", id],
    queryFn: async () => {
      const response = await api.get<ApplicationResponse>(
        `/admin/applications/${id}`
      );

      if (!response.data) {
        throw new Error("Invalid response format from server");
      }

      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation<
    {
      data: {
        success: boolean;
        data: { applicant: Applicant; application: Application };
      };
    },
    Error,
    FormData
  >({
    mutationFn: (data: FormData) =>
      api.post("/applications/submit", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateApplicationData) =>
      api.put(`/admin/applications/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application", id] });
    },
  });
};

interface UpdateApplicationStatusParams {
  id: string;
  status: ApplicationStatus;
  notes?: string;
}

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApplicationWithFiles,
    Error,
    UpdateApplicationStatusParams
  >({
    mutationFn: async ({ id, status, notes }) => {
      const response = await api.put<ApplicationResponse>(
        `/admin/applications/${id}/status`,
        { status, notes }
      );
      if (!response.data) {
        throw new Error("Invalid response format from server");
      }
      return response.data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application", id] });
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/admin/applications/${id}`),
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application", id] });
    },
  });
};

export const useApproveApplication = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApplicationWithFiles,
    Error,
    { id: string } & ApproveApplicationData
  >({
    mutationFn: ({ id, ...data }) =>
      api
        .put(`/admin/applications/${id}/approve`, data)
        .then((res) => res.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application", id] });
    },
  });
};

export const useRejectApplication = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApplicationWithFiles,
    Error,
    { id: string } & RejectApplicationData
  >({
    mutationFn: ({ id, ...data }) =>
      api.put(`/admin/applications/${id}/reject`, data).then((res) => res.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application", id] });
    },
  });
};

export const useRecordInterviewResult = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApplicationWithFiles,
    Error,
    { id: string; result: string; notes?: string }
  >({
    mutationFn: async ({ id, result, notes }) => {
      const response = await api.post<ApplicationResponse>(
        `/admin/applications/${id}/interview`,
        { result, notes }
      );
      if (!response.data) {
        throw new Error("Invalid response format from server");
      }
      return response.data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application", id] });
    },
  });
};

// Export types for use in components
export type {
  ApplicationStatus,
  File as ApplicationFile,
  Application as ApplicationType,
  ApplicationWithFiles,
  ApproveApplicationData,
  RejectApplicationData,
  RecordInterviewResultData,
  UpdateApplicationStatusData,
  UpdateApplicationData,
};
