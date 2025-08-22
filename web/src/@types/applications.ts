import { BaseApiResponse } from "./general";

export type ApplicationStatus =
  | "PENDING"
  | "WAIT_RESULT"
  | "PASS_INTERVIEW"
  | "REJECT_INTERVIEW"
  | "REJECT";

export type FileType = "PHOTO" | "CV";

export type File = {
  id: number;
  filePath: string;
  fileType: FileType;
  applicationId: number;
  uploaderId?: number;
  createdAt: string;
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
  createdBy?: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

export interface Application {
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

export type ApplicationWithFiles = {
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
};

export interface ApplicationsResponse extends BaseApiResponse<any[]> {}
export interface ApplicationResponse extends BaseApiResponse<any> {}

export interface UpdateApplicationStatusParams {
  id: string;
  status: ApplicationStatus;
  notes?: string;
}
