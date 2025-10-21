import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { ApiClientService } from '../../../services/api-client.service';
import { BookService } from '../../../services/book.service';
// Toastify para notificaciones tipo toast
import * as Toastify from 'toastify-js';

interface GoogleBook {
  title: string;
  author?: string;
  isbn: string;
  description?: string;
  category?: string;
  publication_year?: number;
  cover_url?: string;
  added?: boolean;
}

@Component({
  selector: 'app-google-books-search',
  templateUrl: './google-books-search.component.html',
  providers: [ApiClientService],
})
export class GoogleBooksSearchComponent implements OnInit, OnDestroy {
  query = '';
  results: GoogleBook[] = [];
  loading = false;
  error = '';
  success = '';
  addingBook: string | null = null;
  searchField = 'all';

  // caches para evitar duplicados y mostrar estado "Agregado"
  catalogByIsbn: Record<string, any> = {};
  catalogByTitle: Record<string, any> = {};

  private catalogSub?: Subscription;
  private successTimeout?: any;
  private searchDebounce?: any;

  constructor(
    private apiClient: ApiClientService,
    private bookService: BookService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCatalog();
    this.catalogSub = this.bookService.catalogChanged.subscribe(() => {
      this.loadCatalog();
    });
  }

  ngOnDestroy(): void {
    if (this.catalogSub) this.catalogSub.unsubscribe();
    if (this.successTimeout) clearTimeout(this.successTimeout);
  }

  private async loadCatalog(): Promise<void> {
    try {
      const books = await this.bookService.getAll();
      const byIsbn: Record<string, any> = {};
      const byTitle: Record<string, any> = {};
      (Array.isArray(books) ? books : []).forEach((b) => {
        if (b.isbn) byIsbn[b.isbn] = b;
        if (b.title) byTitle[b.title.trim().toLowerCase()] = b;
      });
      this.catalogByIsbn = byIsbn;
      this.catalogByTitle = byTitle;
    } catch (err) {
      console.error('Error cargando catálogo:', err);
    }
  }

  async handleSearch(): Promise<void> {
    if (!this.query.trim()) {
      this.error = 'Por favor ingresa un término de búsqueda';
      return;
    }

    try {
      this.loading = true;
      this.error = '';
      this.results = [];

      const response = await firstValueFrom(
        this.apiClient.get<{ books: GoogleBook[] }>(
          `/api/books/google-books/search?q=${encodeURIComponent(this.query)}`
        )
      );

      const books = response.books || [];
      // aplicar filtrado por campo en cliente
      const q = this.query.trim().toLowerCase();
      this.results = books.filter((b) => {
        if (this.searchField === 'all') return true;
        if (this.searchField === 'title')
          return (b.title || '').toLowerCase().includes(q);
        if (this.searchField === 'description')
          return (b.description || '').toLowerCase().includes(q);
        if (this.searchField === 'category')
          return (b.category || '').toLowerCase().includes(q);
        return true;
      });
    } catch (err: any) {
      this.error = 'Error al buscar en Google Books';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  // Búsqueda en tiempo real con debounce
  onQueryChange(value: string): void {
    this.query = value;
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.handleSearch();
    }, 400);
  }

  // Al cambiar el campo de búsqueda, ejecutar búsqueda inmediata
  onSearchFieldChange(): void {
    // Si hay texto, realizar búsqueda inmediatamente
    if (this.query && this.query.trim()) {
      if (this.searchDebounce) clearTimeout(this.searchDebounce);
      this.handleSearch();
    }
  }

  async handleAddBook(googleBook: GoogleBook): Promise<void> {
    try {
      this.addingBook = googleBook.isbn || googleBook.title;
      this.error = '';
      this.success = '';

      // Limpiar timeout anterior si existe
      if (this.successTimeout) {
        clearTimeout(this.successTimeout);
      }

      const newBook = {
        title: googleBook.title,
        author: googleBook.author || 'Autor desconocido',
        isbn: googleBook.isbn,
        description: googleBook.description || '',
        category: googleBook.category || 'General',
        publication_year: googleBook.publication_year || undefined,
        total_copies: 1,
        available_copies: 1,
        cover_url: googleBook.cover_url || undefined,
      };

      const created = await this.bookService.create(newBook);

      // Actualizar caches locales PRIMERO
      if (created && created.isbn) {
        this.catalogByIsbn[created.isbn] = created;
      }
      if (created && created.title) {
        this.catalogByTitle[created.title.trim().toLowerCase()] = created;
      }

      // Emitir evento para notificar a otros componentes
      // Temporalmente desactivado para diagnosticar recarga/limpieza de la búsqueda
      // this.bookService.emitCatalogChange();

      // Mostrar mensaje de éxito (alerta como respaldo)
      this.success = `Libro "${googleBook.title}" agregado exitosamente al catálogo`;

      // Mostrar toast con Toastify
      try {
        Toastify({
          text: `Libro "${googleBook.title}" agregado al catálogo`,
          duration: 1000,
          gravity: 'top',
          position: 'right',
          close: true,
          style: {
            background: 'linear-gradient(90deg, #28a745, #218838)',
            color: '#fff',
          },
        }).showToast();
      } catch (e) {
        // noop si Toastify falla
        console.warn('Toastify no disponible:', e);
      }

  

      // Auto-ocultar después de 8 segundos (alerta de respaldo)
      this.successTimeout = setTimeout(() => {
        this.success = '';
        this.cdr.detectChanges();
      }, 8000);

      // Actualizar los resultados para reflejar el nuevo estado del libro
      this.results = this.results.map((book) => {
        if (book.isbn === googleBook.isbn || book.title === googleBook.title) {
          return { ...book, added: true };
        }
        return book;
      });

      // Forzar la detección de cambios
      this.cdr.detectChanges();
    } catch (err: any) {
      console.error('Error al agregar libro:', err);
      this.error = err.detail || 'Error al agregar libro al catálogo';

      // Scroll para mostrar el error también
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      this.addingBook = null;
      // Forzar la detección de cambios
      this.cdr.detectChanges();
    }
  }

  clearError(): void {
    this.error = '';
  }

  clearSuccess(): void {
    this.success = '';
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }
}
