import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Book } from '../../services/book.service';

@Component({
  selector: 'app-book-card',
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.css'],
})
export class BookCardComponent {
  @Input() book!: Book;
  @Input() showLoanButton = true;
  @Output() loanRequest = new EventEmitter<number>();
  @Input() showDeleteButton = false;
  @Output() deleteRequest = new EventEmitter<number>();

  constructor(private router: Router) {}

  handleLoanClick(): void {
    this.loanRequest.emit(this.book.id);
  }

  isAvailable(): boolean {
    return this.book.available_copies > 0;
  }

  viewDetails(): void {
    this.router.navigate(['/books', this.book.id]);
  }

  onDeleteClick(): void {
    this.deleteRequest.emit(this.book.id);
  }

  getTruncatedDescription(): string {
    if (!this.book.description) return '';
    return this.book.description.length > 100
      ? `${this.book.description.substring(0, 100)}...`
      : this.book.description;
  }
}
