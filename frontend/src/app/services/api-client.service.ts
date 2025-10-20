import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000';

  constructor(private http: HttpClient, private router: Router) {
    console.log('🔗 API URL configurada:', this.apiUrl);
  }

  /** Construye headers con token si existe */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /** GET */
  get<T>(endpoint: string): Observable<T> {
    return this.http
      .get<T>(`${this.apiUrl}${endpoint}`, { headers: this.getHeaders() })
      .pipe(
        tap(() => console.log('GET:', endpoint)),
        catchError((error) => this.handleError(error))
      );
  }

  /** POST */
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .post<T>(`${this.apiUrl}${endpoint}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap(() => console.log('POST:', endpoint)),
        catchError((error) => this.handleError(error))
      );
  }

  /** UPLOAD - para FormData con progreso */
  upload<T>(
    endpoint: string,
    formData: FormData,
    options?: { reportProgress?: boolean; observe?: 'events' | 'body' }
  ) {
    // No seteamos Content-Type para que el navegador ponga el boundary correcto
    let headers = this.getHeaders();
    headers = headers.delete('Content-Type');

    const requestOptions: any = {
      headers,
      reportProgress: options?.reportProgress ?? false,
      observe: options?.observe ?? 'body',
    };

    console.log(
      'UPLOAD:',
      endpoint,
      requestOptions.reportProgress ? 'with progress' : 'no progress'
    );

    return this.http
      .post<any>(`${this.apiUrl}${endpoint}`, formData, requestOptions)
      .pipe(
        tap(() => console.log('UPLOAD request sent:', endpoint)),
        catchError((error) => this.handleError(error))
      );
  }

  /** PUT */
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .put<T>(`${this.apiUrl}${endpoint}`, data, { headers: this.getHeaders() })
      .pipe(
        tap(() => console.log('PUT:', endpoint)),
        catchError((error) => this.handleError(error))
      );
  }

  /** DELETE */
  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<T>(`${this.apiUrl}${endpoint}`, { headers: this.getHeaders() })
      .pipe(
        tap(() => console.log('DELETE:', endpoint)),
        catchError((error) => this.handleError(error))
      );
  }

  /** Manejo de errores */
  private handleError(error: HttpErrorResponse) {
    console.error('Error en response:', error.status, error.message);

    if (error.status === 401) {
      console.warn('Token expirado o inválido, redirigiendo a login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (!window.location.pathname.includes('/login')) {
        this.router.navigate(['/login']);
      }
    }

    return throwError(() => error.error || { detail: 'Error en la petición' });
  }
}
