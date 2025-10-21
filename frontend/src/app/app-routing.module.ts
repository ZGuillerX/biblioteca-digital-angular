import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

// Páginas principales
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MyLoansComponent } from './pages/my-loans/my-loans.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

// Desde módulo de libros
import { BooksComponent } from './books/pages/books/books.component';
import { BookDetailComponent } from './books/pages/book-detail/book-detail.component';

// Desde módulo de admin
import { AdminComponent } from './admin/pages/admin/admin.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'books', component: BooksComponent },
  { path: 'books/:id', component: BookDetailComponent },
  { path: 'my-loans', component: MyLoansComponent, canActivate: [AuthGuard] },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: { requireAdmin: true },
  },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
