import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, Subject } from 'rxjs';
import { ApiClientService } from './api-client.service';

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  description?: string;
  category?: string;
  publication_year?: number;
  total_copies: number;
  available_copies: number;
  cover_url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookService {
  // Subject para notificar cambios en el catálogo (creación/elim/actualización)
  public catalogChanged: Subject<void> = new Subject<void>();
  constructor(private apiClient: ApiClientService) {}

  async getAll(
    skip = 0,
    limit = 100,
    category: string | null = null
  ): Promise<Book[]> {
    try {
      let url = `/api/books/?skip=${skip}&limit=${limit}`;
      if (category) {
        url += `&category=${category}`;
      }

      const response = await firstValueFrom(this.apiClient.get<Book[]>(url));

      if (!Array.isArray(response)) {
        console.warn('La respuesta no contiene un array de libros:', response);
        return [];
      }

      return response;
    } catch (error) {
      console.error('Error al obtener libros:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<Book> {
    try {
      const response = await firstValueFrom(
        this.apiClient.get<Book>(`/api/books/${id}`)
      );
      return response;
    } catch (error) {
      console.error('Error al obtener libro:', error);
      throw error;
    }
  }

  async search(query: string): Promise<Book[]> {
    try {
      const response = await firstValueFrom(
        this.apiClient.get<Book[]>(
          `/api/books/search/?q=${encodeURIComponent(query)}`
        )
      );

      if (!Array.isArray(response)) {
        console.warn(
          'La respuesta de búsqueda no contiene un array de libros:',
          response
        );
        return [];
      }

      return response;
    } catch (error) {
      console.error('Error en búsqueda:', error);
      throw error;
    }
  }

  async create(bookData: Partial<Book>): Promise<Book> {
    try {
      const response = await firstValueFrom(
        this.apiClient.post<Book>('/api/books/', bookData)
      );
      return response;
    } catch (error) {
      console.error('Error al crear libro:', error);
      throw error;
    }
  }

  async update(id: number, bookData: Partial<Book>): Promise<Book> {
    try {
      const response = await firstValueFrom(
        this.apiClient.put<Book>(`/api/books/${id}`, bookData)
      );
      return response;
    } catch (error) {
      console.error('Error al actualizar libro:', error);
      throw error;
    }
  }

  async delete(id: number, force: boolean = false): Promise<any> {
    try {
      const url = force ? `/api/books/${id}?force=true` : `/api/books/${id}`;
      const response = await firstValueFrom(this.apiClient.delete(url));
      return response;
    } catch (error) {
      console.error('Error al eliminar libro:', error);
      throw error;
    }
  }

  /** Emitir manualmente un evento de cambio del catálogo (útil para uploads masivos) */
  emitCatalogChange(): void {
    try {
      this.catalogChanged.next();
    } catch (e) {
      // noop
    }
  }
}
