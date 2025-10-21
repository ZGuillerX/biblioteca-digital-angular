import { Injectable } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import  { ApiClientService } from './api-client.service';

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
  total_pages?: number;
}

export interface BookPage {
  number: number;
  content: string;
}

export interface BookPagesData {
  book_id: number;
  book_title: string;
  total_pages: number;
  pages: BookPage[];
  is_preview: boolean;
  has_loan: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BookService {
  [x: string]: any;
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

  async delete(id: number, force = false): Promise<any> {
    try {
      const url = force ? `/api/books/${id}?force=true` : `/api/books/${id}`;
      const response = await firstValueFrom(this.apiClient.delete(url));
      return response;
    } catch (error) {
      console.error('Error al eliminar libro:', error);
      throw error;
    }
  }

  async getBookPreview(bookId: number): Promise<BookPagesData> {
    try {
      const response = await firstValueFrom(
        this.apiClient.get<BookPagesData>(`/api/books/${bookId}/preview`)
      );
      return response;
    } catch (error) {
      console.error('Error al obtener vista previa:', error);
      throw error;
    }
  }

  async readBook(bookId: number): Promise<BookPagesData> {
    try {
      const response = await firstValueFrom(
        this.apiClient.get<BookPagesData>(`/api/books/${bookId}/read`)
      );
      return response;
    } catch (error) {
      console.error('Error al leer libro:', error);
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
