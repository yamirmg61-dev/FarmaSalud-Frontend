// src/app/auth/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id?: number;
  username?: string;
  role?: string;
  clienteId?: number;
}

export interface LoginRequest {
  usuario: string;      // aquí mantiene tu formulario actual
  contrasena: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token?: string | null;
  role?: string | null;
  user?: User | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/v1';
  private readonly TOKEN_KEY = 'farma_token';
  private readonly USER_KEY = 'farma_user';

  private authState = new BehaviorSubject<{ isLoggedIn: boolean; user: User | null; token: string | null }>({
    isLoggedIn: false,
    user: null,
    token: null
  });
  public authState$ = this.authState.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadAuthState();
  }

  private loadAuthState(): void {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.authState.next({ isLoggedIn: true, user, token });
      } catch {
        this.clearAuthState();
      }
    }
  }

  private setAuthState(token: string | null, user: User | null, remember = false) {
    if (typeof window !== 'undefined' && remember && token && user) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else if (!remember) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
      }
    }
    this.authState.next({ isLoggedIn: !!user, user, token });
  }

  private clearAuthState() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.authState.next({ isLoggedIn: false, user: null, token: null });
  }

  getToken(): string | null {
    const s = this.authState.value;
    if (s.token) return s.token;
    return (typeof window !== 'undefined') ? localStorage.getItem(this.TOKEN_KEY) : null;
  }

  getCurrentUser(): User | null {
    return this.authState.value.user;
  }

  isAuthenticated(): boolean {
    return this.authState.value.isLoggedIn;
  }

  // ===== LOGIN (mapear usuario -> email) =====
  login(credentials: LoginRequest): Observable<LoginResponse> {
    // <-- aquí hacemos el mapeo: frontend usa usuario/contrasena -> backend email/password
    const body = {
      email: credentials.usuario,
      password: credentials.contrasena
    };

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, body).pipe(
      tap(resp => {
        const token = resp.token ?? null;
        const user: User = resp.user ?? { username: credentials.usuario, role: resp.role ?? undefined };
        this.setAuthState(token, user, !!credentials.rememberMe);
      }),
      catchError(this.handleError)
    );
  }

  // Registro público (cliente)
  registerClient(payload: {
    username: string;
    email: string;
    password: string;
    dni?: string;
    address?: string;
    phone?: string;
  }): Observable<any> {
    return this.http.post(`${this.API_URL}/users/register`, payload).pipe(
      catchError(this.handleError)
    );
  }

  // Crear usuario por admin (requiere token en header; interceptor lo añade)
  createUserByAdmin(payload: {
    username: string;
    email: string;
    password: string;
    role: string;
    position?: string;
    hireDate?: string;
    dni?: string;
    address?: string;
    phone?: string;
  }): Observable<any> {
    return this.http.post(`${this.API_URL}/users/admin`, payload).pipe(
      catchError(this.handleError)
    );
  }

  // Validar token / perfil (ejemplo)
  getProfile(): Observable<any> {
    return this.http.get(`${this.API_URL}/auth/validate`).pipe(
      catchError(this.handleError)
    );
  }

  logout(): void {
    this.clearAuthState();
    this.router.navigate(['/auth/login']);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error inesperado';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.error && (error.error.mensaje || error.error.message)) {
        errorMessage = error.error.mensaje ?? error.error.message;
      } else {
        switch (error.status) {
          case 400: errorMessage = 'Datos inválidos'; break;
          case 401: errorMessage = 'Credenciales inválidas'; break;
          case 403: errorMessage = 'No tienes permisos'; break;
          case 404: errorMessage = 'Servicio no encontrado'; break;
          case 409: errorMessage = error.error?.mensaje ?? 'Conflicto'; break;
          case 500: errorMessage = 'Error interno del servidor'; break;
        }
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
