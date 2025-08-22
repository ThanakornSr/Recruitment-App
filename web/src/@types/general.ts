export interface BaseApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
