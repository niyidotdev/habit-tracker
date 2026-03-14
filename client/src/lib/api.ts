import axios from "axios";
import type {
  AuthResponse,
  CreateHabitPayload,
  UpdateHabitPayload,
  Habit,
  HabitStats,
  Entry,
} from "../types";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear auth state and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const registerUser = (data: {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<AuthResponse> =>
  apiClient.post<AuthResponse>("/auth/register", data).then((r) => r.data);

export const loginUser = (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> =>
  apiClient.post<AuthResponse>("/auth/login", data).then((r) => r.data);

// ─── Habits ──────────────────────────────────────────────────────────────────

export const fetchHabits = (): Promise<{ habits: Habit[] }> =>
  apiClient.get<{ habits: Habit[] }>("/habits").then((r) => r.data);

export const fetchHabitById = (id: string): Promise<{ habit: Habit }> =>
  apiClient.get<{ habit: Habit }>(`/habits/${id}`).then((r) => r.data);

export const fetchHabitStats = (id: string): Promise<HabitStats> =>
  apiClient.get<HabitStats>(`/habits/${id}/stats`).then((r) => r.data);

export const createHabit = (
  data: CreateHabitPayload,
): Promise<{ message: string; habit: Habit }> =>
  apiClient
    .post<{ message: string; habit: Habit }>("/habits", data)
    .then((r) => r.data);

export const updateHabit = (
  id: string,
  data: UpdateHabitPayload,
): Promise<{ message: string; habit: Habit }> =>
  apiClient
    .patch<{ message: string; habit: Habit }>(`/habits/${id}`, data)
    .then((r) => r.data);

export const deleteHabit = (id: string): Promise<{ message: string }> =>
  apiClient.delete<{ message: string }>(`/habits/${id}`).then((r) => r.data);

export const completeHabit = (
  id: string,
  note?: string,
): Promise<{ message: string; entry: Entry }> =>
  apiClient
    .post<{ message: string; entry: Entry }>(`/habits/${id}/complete`, {
      note,
    })
    .then((r) => r.data);
