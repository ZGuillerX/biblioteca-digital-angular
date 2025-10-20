import { Component, OnInit } from '@angular/core';
import { Loan, LoanService } from '../../services/loan.service';

@Component({
  selector: 'app-my-loans',
  templateUrl: './my-loans.component.html',
  // styleUrls: ['./my-loans.component.css'],
})
export class MyLoansComponent implements OnInit {
  loans: Loan[] = [];
  loading = true;
  error = '';
  success = '';
  filter = 'all';

  constructor(private loanService: LoanService) {}

  ngOnInit(): void {
    this.loadLoans();
  }

  async loadLoans(): Promise<void> {
    try {
      this.loading = true;
      this.error = '';
      const statusFilter = this.filter === 'all' ? null : this.filter;
      const response = await this.loanService.getMyLoans(statusFilter);
      const data = Array.isArray(response) ? response : [];
      this.loans = data;
    } catch (err: any) {
      this.error = 'Error al cargar préstamos';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async handleReturn(loanId: number): Promise<void> {
    if (!confirm('¿Estás seguro de que quieres devolver este libro?')) {
      return;
    }

    try {
      this.error = '';
      this.success = '';
      const result = await this.loanService.returnBook(loanId);
      this.success = result?.message || 'Libro devuelto correctamente';

      await this.loadLoans();

      setTimeout(() => (this.success = ''), 3000);
    } catch (err: any) {
      this.error = err.detail || 'Error al devolver libro';
      console.error(err);
    }
  }

  setFilter(filter: string): void {
    this.filter = filter;
    this.loadLoans();
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      activo: 'bg-primary',
      devuelto: 'bg-success',
      vencido: 'bg-danger',
    };
    return classes[status] || 'bg-secondary';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  isOverdue(dueDate: string, status: string): boolean {
    return status === 'activo' && new Date(dueDate) < new Date();
  }

  getDaysRemaining(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getFilteredLoans(status: string): Loan[] {
    return this.loans.filter((l) => l.status === status);
  }

  clearError(): void {
    this.error = '';
  }

  clearSuccess(): void {
    this.success = '';
  }
}
