import { Component, OnInit, OnDestroy } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { ApiClientService } from '../../services/api-client.service';
import { BookService } from '../../services/book.service';

interface GoogleBook {
  title: string;
  author?: string;
  isbn: string;
  description?: string;
  category?: string;
  publication_year?: number;
  cover_url?: string;
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

  constructor(
    private apiClient: ApiClientService,
    private bookService: BookService
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
      this.bookService.emitCatalogChange();

      // Mostrar mensaje de éxito
      this.success = `✓ Libro "${googleBook.title}" agregado exitosamente al catálogo`;

      // Scroll suave hacia arriba para mostrar la notificación
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);

      // Auto-ocultar después de 8 segundos (más tiempo para que se vea)
      this.successTimeout = setTimeout(() => {
        this.success = '';
      }, 8000);
    } catch (err: any) {
      console.error('Error al agregar libro:', err);
      this.error = err.detail || 'Error al agregar libro al catálogo';

      // Scroll para mostrar el error también
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } finally {
      this.addingBook = null;
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
