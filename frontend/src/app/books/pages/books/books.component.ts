import { Component,OnInit } from "@angular/core"

import { Book, BookService } from "src/app/services/book.service"
import { LoanService } from "src/app/services/loan.service"
import  { AuthService } from "src/app/services/auth.service"

declare var bootstrap: any

@Component({
  selector: "app-books",
  templateUrl: "./books.component.html",
  // styleUrls: ['./books.component.css'],
})
export class BooksComponent implements OnInit {
  books: Book[] = []
  filteredBooks: Book[] = []
  loading = true
  error = ""
  success = ""
  isAuthenticated = false
  selectedBookForPreview: number | null = null

  constructor(
    private bookService: BookService,
    private loanService: LoanService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadBooks()
    this.authService.isAuthenticated$.subscribe((isAuth) => (this.isAuthenticated = isAuth))
  }

  async loadBooks(): Promise<void> {
    try {
      this.loading = true
      this.error = ""

      const data = await this.bookService.getAll()
      const booksArray = Array.isArray(data) ? data : []

      this.books = booksArray
      this.filteredBooks = booksArray
    } catch (err: any) {
      this.error = "Error al cargar libros"
      console.error("Error en loadBooks:", err)
      this.books = []
      this.filteredBooks = []
    } finally {
      this.loading = false
    }
  }

  handleSearch(results: Book[]): void {
    const resultsArray = Array.isArray(results) ? results : []
    this.filteredBooks = resultsArray
  }

  async handleLoanRequest(bookId: number): Promise<void> {
    if (!this.isAuthenticated) {
      this.error = "Debes iniciar sesión para solicitar préstamos"
      return
    }

    try {
      this.error = ""
      this.success = ""
      await this.loanService.create(bookId)
      this.success = "¡Préstamo solicitado exitosamente!"

      await this.loadBooks()

      setTimeout(() => (this.success = ""), 3000)
    } catch (err: any) {
      const errorMessage = err.detail || err.message || "Error al solicitar préstamo"
      this.error = errorMessage
      console.error("Error en handleLoanRequest:", err)

      setTimeout(() => (this.error = ""), 5000)
    }
  }

  handlePreviewRequest(bookId: number): void {
    this.selectedBookForPreview = bookId
    const modalElement = document.getElementById("previewModal")
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement)
      modal.show()
    }
  }

  clearError(): void {
    this.error = ""
  }

  clearSuccess(): void {
    this.success = ""
  }

  handleBookAdded(): void {
    this.success = "El libro ha sido agregado exitosamente al catálogo."
    this.loadBooks()
  }
}
