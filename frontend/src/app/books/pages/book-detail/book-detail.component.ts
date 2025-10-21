import { Component, OnInit } from "@angular/core"
import { ActivatedRoute, Router } from "@angular/router"
import { Book, BookService } from "src/app/services/book.service"
import { LoanService } from "src/app/services/loan.service"
import { AuthService } from "src/app/services/auth.service"

@Component({
  selector: "app-book-detail",
  templateUrl: "./book-detail.component.html",
  // styleUrls: ['./book-detail.component.css']
})
export class BookDetailComponent implements OnInit {
  book: Book | null = null
  loading = true
  error = ""
  success = ""
  isAuthenticated = false
  hasActiveLoan = false
  showReader = false
  isPreviewMode = false

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private loanService: LoanService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((isAuth) => (this.isAuthenticated = isAuth))

    this.route.params.subscribe((params) => {
      const id = +params["id"]
      this.loadBook(id)
      if (this.isAuthenticated) {
        this.checkUserLoan(id)
      }
    })
  }

  async loadBook(id: number): Promise<void> {
    try {
      this.loading = true
      this.error = ""
      const data = await this.bookService.getById(id)
      this.book = data
    } catch (err: any) {
      this.error = "Libro no encontrado"
      console.error(err)
    } finally {
      this.loading = false
    }
  }

  async checkUserLoan(bookId: number): Promise<void> {
    try {
      const loans = await this.loanService.getMyLoans("activo")
      this.hasActiveLoan = loans.some((loan) => loan.book_id === bookId)
    } catch (err: any) {
      console.error("Error al verificar préstamos:", err)
    }
  }

  async handleLoanRequest(): Promise<void> {
    if (!this.isAuthenticated) {
      this.error = "Debes iniciar sesión para solicitar préstamos"
      return
    }

    if (!this.book) return

    try {
      this.error = ""
      this.success = ""
      await this.loanService.create(this.book.id)
      this.success = "¡Préstamo solicitado exitosamente!"

      await this.loadBook(this.book.id)
      await this.checkUserLoan(this.book.id)
    } catch (err: any) {
      this.error = err.detail || "Error al solicitar préstamo"
      console.error(err)
    }
  }

  handleReadBook(): void {
    this.showReader = true
    this.isPreviewMode = false
    // Scroll hacia el lector
    setTimeout(() => {
      const readerElement = document.querySelector(".book-reader")
      if (readerElement) {
        readerElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  handlePreviewBook(): void {
    this.showReader = true
    this.isPreviewMode = true
    // Scroll hacia el lector
    setTimeout(() => {
      const readerElement = document.querySelector(".book-reader")
      if (readerElement) {
        readerElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  isAvailable(): boolean {
    return this.book ? this.book.available_copies > 0 : false
  }

  goBack(): void {
    this.router.navigate(["/books"])
  }

  clearError(): void {
    this.error = ""
  }

  clearSuccess(): void {
    this.success = ""
  }
}
