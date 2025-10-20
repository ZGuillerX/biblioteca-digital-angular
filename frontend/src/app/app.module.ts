import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Layout
import { NavbarComponent } from './components/navbar/navbar.component';

// Pages
import { HomeComponent } from './pages/home/home.component';
import { BooksComponent } from './pages/books/books.component';
import { BookDetailComponent } from './pages/book-detail/book-detail.component';
import { MyLoansComponent } from './pages/my-loans/my-loans.component';
import { AdminComponent } from './pages/admin/admin.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

// Components
import { BookCardComponent } from './components/book-card/book-card.component.';
import { BookSearchComponent } from './components/book-search/book-search.component';
import { BulkUploadComponent } from './components/bulk-upload/bulk-upload.component';
import { GoogleBooksSearchComponent } from './components/google-books-search/google-books-search.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    BooksComponent,
    BookDetailComponent,
    MyLoansComponent,
    AdminComponent,
    LoginComponent,
    RegisterComponent,
    NotFoundComponent,
    BookCardComponent,
    BookSearchComponent,
    BulkUploadComponent,
    GoogleBooksSearchComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
