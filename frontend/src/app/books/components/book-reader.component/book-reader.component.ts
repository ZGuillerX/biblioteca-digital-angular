import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { BookService } from 'src/app/services/book.service';

export interface BookPage {
  number: number;
  content: string;
}

export interface BookPagesData {
  book_id: number;
  book_title: string;
  google_books_id?: string;
  total_pages: number;
  pages: BookPage[];
  is_preview: boolean;
  has_loan: boolean;
}

export interface BookDetails {
  id: number;
  title: string;
  author: string;
  isbn: string;
  description?: string;
  category?: string;
  publication_year?: number;
  cover_url?: string;
  total_copies: number;
  available_copies: number;
}

@Component({
  selector: 'app-book-reader',
  templateUrl: './book-reader.component.html',
  styleUrls: ['./book-reader.component.scss'],
})
export class BookReaderComponent implements OnInit, OnChanges {
  @Input() bookId!: number;
  @Input() isPreview = false;

  bookData: BookPagesData | null = null;
  bookDetails: BookDetails | null = null;
  loading = true;
  error = '';
  currentPage = 0;
  displayMode: 'single' | 'double' = 'single';
  viewerUrl = '';
  showIframe = false;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadBook();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bookId'] && !changes['bookId'].firstChange) {
      // Cuando cambia el libro, reiniciamos y recargamos
      this.currentPage = 0;
      this.loadBook();
    }
  }

  async loadBook(): Promise<void> {
    if (!this.bookId) return;

    this.loading = true;
    this.error = '';
    this.bookData = null;
    this.bookDetails = null;
    this.viewerUrl = '';
    this.showIframe = false;

    try {
      // Cargar datos de las páginas
      this.bookData = this.isPreview
        ? await this.bookService.getBookPreview(this.bookId)
        : await this.bookService.readBook(this.bookId);

      // Cargar detalles del libro (título, autor, portada, descripción, etc.)
      this.bookDetails = await this.bookService.getById(this.bookId);

      // Mostrar iframe solo si tiene préstamo y no es preview
      this.showIframe = !!(this.bookData.has_loan && !this.bookData.is_preview);

      if (this.showIframe && this.bookData.google_books_id) {
        this.viewerUrl = `https://books.google.com/books?id=${this.bookData.google_books_id}&lpg=PP1&pg=PP1&output=embed`;
      }
    } catch (err: any) {
      this.error = err.detail || err.message || 'Error al cargar el libro';
      console.error('Error al cargar libro:', err);
    } finally {
      this.loading = false;
    }
  }

  // ... resto de métodos (nextPage, previousPage, etc.) se mantienen igual
}
