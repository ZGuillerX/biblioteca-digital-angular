import { Injectable } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { Book } from '../books/models/book.model';

export { Book };
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

export interface Review {
  id: number;
  user_id: number;
  book_id: number;
  rating: number;
  comment: string;
  created_at: string;
  username?: string;
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

  async getBookReviews(bookId: number): Promise<Review[]> {
    try {
      const response = await firstValueFrom(
        this.apiClient.get<Review[]>(`/api/reviews/book/${bookId}`)
      );
      return response;
    } catch (error) {
      console.error('Error al obtener reseñas del libro:', error);
      throw error;
    }
  }

  async createReview(
    bookId: number,
    rating: number,
    comment: string
  ): Promise<Review> {
    try {
      const reviewData = { book_id: bookId, rating, comment };
      const response = await firstValueFrom(
        this.apiClient.post<Review>('/api/reviews/', reviewData)
      );
      return response;
    } catch (error) {
      console.error('Error al crear reseña:', error);
      throw error;
    }
  }

  async deleteReview(reviewId: number): Promise<void> {
    try {
      await firstValueFrom(this.apiClient.delete(`/api/reviews/${reviewId}`));
    } catch (error) {
      console.error('Error al eliminar reseña:', error);
      throw error;
    }
  }

  async getRecommendedBooks(limit: number = 5): Promise<Book[]> {
    try {
      const response = await firstValueFrom(
        this.apiClient.get<Book[]>(`/api/books/recommended?limit=${limit}`)
      );
      return response;
    } catch (error) {
      console.error('Error al obtener libros recomendados:', error);
      throw error;
    }
  }
}
