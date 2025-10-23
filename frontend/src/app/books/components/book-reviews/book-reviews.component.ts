import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { BookService, Book, Review } from '../../../services/book.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-book-reviews',
  templateUrl: './book-reviews.component.html',
  styleUrls: ['./book-reviews.component.scss'],
})
export class BookReviewsComponent implements OnInit {
  @Output() reviewUpdated = new EventEmitter<void>();
  @Input() book!: Book;
  reviews: Review[] = [];
  newReview: { rating: number; comment: string } = { rating: 0, comment: '' };
  isLoggedIn = false;

  constructor(
    private bookService: BookService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadReviews();
    this.isLoggedIn = this.authService.isAuthenticated();
  }

  async loadReviews(): Promise<void> {
    try {
      this.reviews = await this.bookService.getBookReviews(this.book.id);
    } catch (error) {
      console.error('Error al cargar las reseñas:', error);
    }
  }

  async submitReview(): Promise<void> {
    if (this.newReview.rating === 0) {
      alert('Por favor, selecciona una calificación.');
      return;
    }

    try {
      await this.bookService.createReview(
        this.book.id,
        this.newReview.rating,
        this.newReview.comment
      );
      this.newReview = { rating: 0, comment: '' };
      await this.loadReviews();
      this.reviewUpdated.emit();
    } catch (error) {
      console.error('Error al enviar la reseña:', error);
      alert('Hubo un error al enviar tu reseña. Por favor, intenta de nuevo.');
    }
  }

  async deleteReview(reviewId: number): Promise<void> {
    if (confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
      try {
        await this.bookService.deleteReview(reviewId);
        await this.loadReviews();
        this.reviewUpdated.emit();
      } catch (error) {
        console.error('Error al eliminar la reseña:', error);
        alert(
          'Hubo un error al eliminar la reseña. Por favor, intenta de nuevo.'
        );
      }
    }
  }
}
