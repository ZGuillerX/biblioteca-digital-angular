import { Component, OnInit, OnDestroy } from '@angular/core';
import { Book, BookService } from '../../services/book.service';
import { Loan, LoanService } from '../../services/loan.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  // styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  activeTab = 'dashboard';

  stats = {
    totalBooks: 0,
    totalLoans: 0,
    activeLoans: 0,
    overdueLoans: 0,
  };

  books: Book[] = [];
  loans: Loan[] = [];
  loading = true;
  error = '';

  success = '';

  showModal = false;
  newBook: Partial<Book> = {
    title: '',
    author: '',
    isbn: '',
    description: '',
    category: '',
    publication_year: undefined,
    total_copies: 1,
    available_copies: 1,
  };

  constructor(
    private bookService: BookService,
    private loanService: LoanService
  ) {}

  private catalogSub?: Subscription;

  ngOnInit(): void {
    this.loadAdminData();
    this.catalogSub = this.bookService.catalogChanged.subscribe(() => {
      this.loadAdminData();
    });
  }

  ngOnDestroy(): void {
    if (this.catalogSub) this.catalogSub.unsubscribe();
  }

  async handleDeleteFromAdmin(bookId: number): Promise<void> {
    try {
      this.error = '';
      // Forzar eliminación (backend eliminará préstamos si existe force)
      await this.bookService.delete(bookId, true);
      this.books = this.books.filter((b) => b.id !== bookId);
      this.stats.totalBooks = Math.max(0, this.stats.totalBooks - 1);
      this.success = 'Libro eliminado correctamente';
      // notificar cambios al catálogo después de mostrar success
      this.bookService.emitCatalogChange();
      setTimeout(() => (this.success = ''), 3500);
    } catch (err: any) {
      console.error('Error al eliminar libro desde admin:', err);
      this.error = err?.detail || 'Error al eliminar libro';
    }
  }

  async loadAdminData(): Promise<void> {
    try {
      this.loading = true;
      this.error = '';

      const booksData = await this.bookService.getAll();
      const loansData = await this.loanService.getAll();

      const activeLoans = loansData.filter((l) => l.status === 'activo').length;
      const overdueLoans = loansData.filter(
        (l) => l.status === 'vencido'
      ).length;

      this.stats = {
        totalBooks: booksData.length,
        totalLoans: loansData.length,
        activeLoans,
        overdueLoans,
      };

      this.books = booksData;
      this.loans = loansData.slice(0, 10);
    } catch (err: any) {
      this.error = 'Error al cargar datos de administración';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async handleCreateBook(): Promise<void> {
    console.log('🚀 handleCreateBook iniciado');
    console.log('📦 Datos del nuevo libro:', this.newBook);

    try {
      this.error = '';

      const createdBook = await this.bookService.create(this.newBook);

      console.log('✅ Libro creado correctamente:', createdBook);

      this.showModal = false;
      this.resetNewBook();

      this.books = [createdBook, ...this.books];

      alert('Libro creado exitosamente');
    } catch (err: any) {
      console.error('Error en handleCreateBook:', err);
      this.error = err.detail || 'Error al crear libro';
    }
  }

  resetNewBook(): void {
    this.newBook = {
      title: '',
      author: '',
      isbn: '',
      description: '',
      category: '',
      publication_year: undefined,
      total_copies: 1,
      available_copies: 1,
    };
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  openCreateModal(): void {
    this.showModal = true;
    this.resetNewBook();
  }

  closeModal(): void {
    this.showModal = false;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  clearError(): void {
    this.error = '';
  }

  clearSuccess(): void {
    this.success = '';
  }
}
