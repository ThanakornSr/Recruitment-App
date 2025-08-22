import { BaseApiResponse } from "./general";

export type ApplicationStatus =
  | "PENDING" // Application received, no action yet
  | "SCHEDULED" // Interview scheduled
  | "WAIT_RESULT" // Interview done, waiting for result
  | "PASS_INTERVIEW" // Passed interview
  | "REJECT_INTERVIEW" // Failed interview
  | "REJECT"; // Rejected without interview

export type FileType = "PHOTO" | "CV";

export interface File {
  id: number;
  filePath: string;
  fileType: FileType;
  applicationId: number;
  uploaderId?: number;
  createdAt: string;
}

export interface Applicant {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  position: string;
  dateOfBirth?: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  updatedBy?: string | null;
  createdById?: number | null;
  createdBy?: {
    id: number;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface ApplicationHistory {
  id: number;
  status: ApplicationStatus;
  files: File[];
}

export interface Application {
  id: number;
  fullName: string;
  email: string;
  position: string;
  phone?: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  isUpdating?: boolean;
  applications: ApplicationHistory[];
}

export interface ApplicationWithFiles {
  id: number;
  status: ApplicationStatus;
  notes?: string | null;
  applicant: Applicant;
  files: File[];
  photoPath?: string;
  cvPath?: string;
  updatedAt: string;
  createdAt: string;
  applicantId: number;
}

export interface ApplicationsResponse extends BaseApiResponse<Application[]> {}
export interface ApplicationResponse extends BaseApiResponse<Application> {}

export interface UpdateApplicationStatusParams {
  id: string;
  status: ApplicationStatus;
  notes?: string;
}
