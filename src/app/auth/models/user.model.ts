// src/app/auth/models/user.model.ts
export interface User {
  id: number;
  username: string;
  role?: string;
  clienteId?: number;
}

export interface LoginRequest {
  usuario: string;      // nombre del campo en el formulario
  contrasena: string;   // nombre del campo en el formulario
  rememberMe?: boolean;
}

export interface LoginResponse {
  token?: string | null;
  user: User;
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
}
