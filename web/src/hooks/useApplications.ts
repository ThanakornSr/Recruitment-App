import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { ApplicationResponse, ApplicationsResponse, ApplicationStatus, ApplicationWithFiles, BaseApiResponse, UpdateApplicationStatusParams } from "../@types";

export const useApplications = (status?: ApplicationStatus => {
  return useQuery<ApplicationWithFiles[]>({
    queryKey: status ? ["applications", status] : ["applications"],
    queryFn: async () => {
      const response = await api.get<ApplicationsResponse>(
        "/admin/applications",
        {
          params: status,
        }
      );

      if (!response.data || !response.data.success) {
        throw new Error("Invalid response format from server");
      }

      return response.data.data.map((applicant: any) => {
        const latestApp = applicant.applications[0];
        const photoFile = latestApp?.files.find(
          (f: any) => f.fileType === "PHOTO"
        );
        const cvFile = latestApp?.files.find((f: any) => f.fileType === "CV");

        return {
          id: latestApp.id,
          status: latestApp.status,
          notes: latestApp.notes,
          applicant: {
            id: applicant.id,
            fullName: applicant.fullName,
            email: applicant.email,
            phone: applicant.phone,
            position: applicant.position,
            dateOfBirth: applicant.dateOfBirth,
            status: applicant.status,
            appliedAt: applicant.appliedAt,
            updatedAt: applicant.updatedAt,
            updatedBy: applicant.updatedBy,
            createdById: applicant.createdById,
            createdBy: applicant.createdBy,
          },
          files: latestApp.files,
          photoPath: photoFile?.filePath,
          cvPath: cvFile?.filePath,
          updatedAt: latestApp.updatedAt,
          createdAt: latestApp.createdAt,
          applicantId: applicant.id,
        } as ApplicationWithFiles;
      });
    },
    keepPreviousData: true,
  });
};

export const useApplication = (id: string) => {
  return useQuery<ApplicationWithFiles>({
    queryKey: ["application", id],
    queryFn: async () => {
      const response = await api.get<ApplicationResponse>(
        `/admin/applications/${id}`
      );
      if (!response.data || !response.data.success) {
        throw new Error("Invalid response format from server");
      }

      const applicant = response.data.data;
      const latestApp = applicant.applications[0];
      const photoFile = latestApp?.files.find(
        (f: any) => f.fileType === "PHOTO"
      );
      const cvFile = latestApp?.files.find((f: any) => f.fileType === "CV");

      return {
        id: latestApp.id,
        status: latestApp.status,
        notes: latestApp.notes,
        applicant: {
          id: applicant.id,
          fullName: applicant.fullName,
          email: applicant.email,
          phone: applicant.phone,
          position: applicant.position,
          dateOfBirth: applicant.dateOfBirth,
          status: applicant.status,
          appliedAt: applicant.appliedAt,
          updatedAt: applicant.updatedAt,
          updatedBy: applicant.updatedBy,
          createdById: applicant.createdById,
          createdBy: applicant.createdBy,
        },
        files: latestApp.files,
        photoPath: photoFile?.filePath,
        cvPath: cvFile?.filePath,
        updatedAt: latestApp.updatedAt,
        createdAt: latestApp.createdAt,
        applicantId: applicant.id,
      } as ApplicationWithFiles;
    },
    enabled: !!id,
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseApiResponse<any>, Error, FormData>({
    mutationFn: (data: FormData) =>
      api.post("/applications/submit", data, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};

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
        { status: status, notes }
      );
      if (!response.data || !response.data.success) {
        throw new Error("Invalid response format from server");
      }
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
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
    { id: string; interviewDate: string; notes?: string }
  >({
    mutationFn: ({ id, ...data }) =>
      api
        .put(`/admin/applications/${id}/approve`, data)
        .then((res) => res.data.data),
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
    { id: string; notes?: string }
  >({
    mutationFn: ({ id, ...data }) =>
      api
        .put(`/admin/applications/${id}/reject`, data)
        .then((res) => res.data.data),
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
    {
      id: string;
      result: "PASS_INTERVIEW" | "REJECT_INTERVIEW";
      notes?: string;
    }
  >({
    mutationFn: ({ id, ...data }) =>
      api
        .put(`/admin/applications/${id}/interview-result`, data)
        .then((res) => res.data.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application", id] });
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/admin/applications/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application", id] });
    },
  });
};
