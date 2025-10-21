import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Components
import { BookCardComponent } from './components/book-card/book-card.component.';
import { BookSearchComponent } from './components/book-search/book-search.component';
import { BulkUploadComponent } from './components/bulk-upload/bulk-upload.component';
import { GoogleBooksSearchComponent } from './components/google-books-search/google-books-search.component';
import { BookReaderComponent } from './components/book-reader.component/book-reader.component';

// Pages
import { BooksComponent } from './pages/books/books.component';
import { BookDetailComponent } from './pages/book-detail/book-detail.component';

import { SafePipe } from '../pipes/safe.pipe';

@NgModule({
  declarations: [
    BookCardComponent,
    BookSearchComponent,
    BulkUploadComponent,
    GoogleBooksSearchComponent,
    BookReaderComponent,
    BooksComponent,
    BookDetailComponent,
    SafePipe,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  exports: [
    BooksComponent,
    BookDetailComponent,
    BookCardComponent,
    BulkUploadComponent,
    GoogleBooksSearchComponent,
    BookReaderComponent,
  ],
})
export class BooksModule {}
