import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Book, BookService } from '../../services/book.service';
import { LoanService } from '../../services/loan.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.component.html',
  // styleUrls: ['./book-detail.component.css']
})
export class BookDetailComponent implements OnInit {
  book: Book | null = null;
  loading = true;
  error = '';
  success = '';
  isAuthenticated = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private loanService: LoanService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(
      isAuth => this.isAuthenticated = isAuth
    );

    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadBook(id);
    });
  }

  async loadBook(id: number): Promise<void> {
    try {
      this.loading = true;
      this.error = '';
      const data = await this.bookService.getById(id);
      this.book = data;
    } catch (err: any) {
      this.error = 'Libro no encontrado';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async handleLoanRequest(): Promise<void> {
    if (!this.isAuthenticated) {
      this.error = 'Debes iniciar sesión para solicitar préstamos';
      return;
    }

    if (!this.book) return;

    try {
      this.error = '';
      this.success = '';
      await this.loanService.create(this.book.id);
      this.success = '¡Préstamo solicitado exitosamente!';

      await this.loadBook(this.book.id);
    } catch (err: any) {
      this.error = err.detail || 'Error al solicitar préstamo';
      console.error(err);
    }
  }

  isAvailable(): boolean {
    return this.book ? this.book.available_copies > 0 : false;
  }

  goBack(): void {
    this.router.navigate(['/books']);
  }

  clearError(): void {
    this.error = '';
  }

  clearSuccess(): void {
    this.success = '';
  }
}