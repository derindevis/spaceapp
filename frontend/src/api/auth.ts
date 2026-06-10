import { apiClient } from "./client";

export type User = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  full_name?: string;
};

export function login(payload: LoginPayload) {
  return apiClient.post<AuthResponse, LoginPayload>("/auth/login", payload);
}

export function register(payload: RegisterPayload) {
  return apiClient.post<AuthResponse, RegisterPayload>("/auth/register", payload);
}

export function getCurrentUser(token: string) {
  return apiClient.get<User>("/auth/me", { token });
}

