import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from './api-client.service';

export interface Loan {
  id: number;
  user_id: number;
  book_id: number;
  loan_date: string;
  due_date: string;
  return_date?: string;
  status: 'activo' | 'devuelto' | 'vencido';
  book_title: string;
  book_author: string;
  user_username: string;
}

export interface LoanResponse {
  data: Loan | Loan[];
}

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  constructor(private apiClient: ApiClientService) {}

  async create(bookId: number): Promise<Loan> {
    try {
      const response = await firstValueFrom(
        this.apiClient.post<LoanResponse>('/api/loans', { book_id: bookId })
      );
      return (response.data as Loan) || response as any;
    } catch (error) {
      throw error;
    }
  }

  async getMyLoans(status: string | null = null): Promise<Loan[]> {
    try {
      let url = '/api/loans/my-loans';
      if (status) {
        url += `?status_filter=${encodeURIComponent(status)}`;
      }

      const response = await firstValueFrom(
        this.apiClient.get<LoanResponse>(url)
      );

      const data = response.data || response;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  }

  async returnBook(loanId: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.apiClient.put<any>(`/api/loans/${loanId}/return`, {})
      );
      return response.data || response;
    } catch (error) {
      throw error;
    }
  }

  async getAll(skip = 0, limit = 50, status: string | null = null): Promise<Loan[]> {
    try {
      let url = `/api/loans?skip=${skip}&limit=${limit}`;
      if (status) {
        url += `&status_filter=${encodeURIComponent(status)}`;
      }

      const response = await firstValueFrom(
        this.apiClient.get<LoanResponse>(url)
      );

      const data = response.data || response;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  }

  async getById(id: number): Promise<Loan> {
    try {
      const response = await firstValueFrom(
        this.apiClient.get<LoanResponse>(`/api/loans/${id}`)
      );
      return (response.data as Loan) || response as any;
    } catch (error) {
      throw error;
    }
  }
}