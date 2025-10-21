import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Book, BookService } from '../../../services/book.service';

@Component({
  selector: 'app-book-search',
  templateUrl: './book-search.component.html',
  // styleUrls: ['./book-search.component.css'],
})
export class BookSearchComponent implements OnInit {
  @Input() books: Book[] = [];
  @Output() searchResults = new EventEmitter<Book[]>();

  searchTerm = '';
  category = '';
  searching = false;
  categories: string[] = [];

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.updateCategories();
  }

  ngOnChanges(): void {
    this.updateCategories();
  }

  private updateCategories(): void {
    if (!Array.isArray(this.books)) return;

    const uniqueCategories = [
      ...new Set(
        this.books
          .map((book) => book.category)
          .filter((cat): cat is string => !!cat && cat.trim() !== '')
      ),
    ];

    this.categories = uniqueCategories.sort();
  }

  async handleSearch(): Promise<void> {
    if (!this.searchTerm.trim()) {
      this.filterByCategory();
      return;
    }

    try {
      this.searching = true;
      const results = await this.bookService.search(this.searchTerm);

      const resultsArray = Array.isArray(results) ? results : [];

      if (this.category) {
        const filtered = resultsArray.filter(
          (book) => book.category === this.category
        );
        this.searchResults.emit(filtered);
      } else {
        this.searchResults.emit(resultsArray);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      this.searchResults.emit([]);
    } finally {
      this.searching = false;
    }
  }

  filterByCategory(): void {
    if (!Array.isArray(this.books)) {
      this.searchResults.emit([]);
      return;
    }

    if (this.category) {
      const filtered = this.books.filter(
        (book) => book.category === this.category
      );
      this.searchResults.emit(filtered);
    } else {
      this.searchResults.emit(this.books);
    }
  }

  async handleCategoryChange(): Promise<void> {
    this.searchTerm = '';

    try {
      this.searching = true;
      const results = await this.bookService.getAll(
        0,
        100,
        this.category || null
      );
      const booksArray = Array.isArray(results) ? results : [];
      this.searchResults.emit(booksArray);
    } catch (err) {
      console.error('Error al filtrar por categoría:', err);
      this.searchResults.emit([]);
    } finally {
      this.searching = false;
    }
  }

  handleClear(): void {
    this.searchTerm = '';
    this.category = '';
    this.searchResults.emit(Array.isArray(this.books) ? this.books : []);
  }
}
