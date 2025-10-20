import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { ApiClientService } from './api-client.service';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;
}

export interface LoginResponse {
  data: {
    access_token: string;
  };
}

export interface UserResponse {
  data: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(true);
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private apiClient: ApiClientService,
    private router: Router
  ) {
    this.loadUser();
  }

  private loadUser(): void {
    try {
      if (this.isAuthenticated()) {
        const storedUser = this.getStoredUser();
        this.currentUserSubject.next(storedUser);
        this.isAuthenticatedSubject.next(true);
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async register(userData: any): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await firstValueFrom(
        this.apiClient.post('/api/auth/register', userData)
      );
      return { success: true };
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, error };
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await firstValueFrom(
        this.apiClient.post<LoginResponse>('/api/auth/login', { username, password })
      );

      const token = response.data?.access_token;
      if (!token) throw new Error('Token no recibido');

      localStorage.setItem('token', token);

      const userInfo = await this.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userInfo));

      this.currentUserSubject.next(userInfo);
      this.isAuthenticatedSubject.next(true);

      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error };
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.apiClient.get<UserResponse>('/api/auth/me')
      );
      return response.data || response as any;
    } catch (error) {
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAdmin(): boolean {
    const user = this.getStoredUser();
    return user?.role === 'admin';
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }
}