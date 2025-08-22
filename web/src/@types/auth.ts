export interface LoginResponse {
  user: User;
  token: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
  isAdmin: boolean;
}
