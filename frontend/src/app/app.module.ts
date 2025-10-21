import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Interceptors
import { AuthInterceptor } from './services/auth.interceptor';

// Feature Modules
import { SharedModule } from './shared/shared.module';
import { BooksModule } from './books/books.module';
import { AdminModule } from './admin/pages/admin.module';
import { PagesModule } from './pages/pages.module';

@NgModule({
  declarations: [
    AppComponent, // Solo el componente raíz se queda aquí
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule, // Navbar y componentes reutilizables
    BooksModule,  // Módulo con componentes y páginas de libros
    AdminModule,  // Módulo con componentes de administración
    PagesModule,  // Módulo con Home, Login, Register, etc.
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
