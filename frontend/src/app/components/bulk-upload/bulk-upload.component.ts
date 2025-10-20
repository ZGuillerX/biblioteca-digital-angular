import { Component, Inject } from '@angular/core';
import { HttpHeaders, HttpEventType, HttpResponse } from '@angular/common/http';
import { ApiClientService } from '../../services/api-client.service';

interface BulkUploadResult {
  summary: {
    total_rows: number;
    successful: number;
    enriched: number;
    skipped: number;
    errors: number;
  };
  details: {
    success?: Array<{ row: number; title: string; isbn: string }>;
    skipped?: Array<{ row: number; isbn?: string; reason: string }>;
    errors?: Array<{ row: number; isbn?: string; error: string }>;
  };
}

@Component({
  selector: 'app-bulk-upload',
  templateUrl: './bulk-upload.component.html',
  // styleUrls: ['./bulk-upload.component.css'],
})
export class BulkUploadComponent {
  file: File | null = null;
  enrichWithGoogle = false;
  uploading = false;
  progress = 0;
  result: BulkUploadResult | null = null;
  error = '';

  constructor(@Inject(ApiClientService) private apiClient: ApiClientService) {}

  onFileChange(event: any): void {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        this.error = 'Solo se aceptan archivos Excel (.xlsx, .xls)';
        this.file = null;
        return;
      }
      this.file = selectedFile;
      this.error = '';
      this.result = null;
    }
  }

  async handleUpload(): Promise<void> {
    if (!this.file) {
      this.error = 'Por favor selecciona un archivo Excel';
      return;
    }

    try {
      this.uploading = true;
      this.progress = 0;
      this.error = '';
      this.result = null;

      const formData = new FormData();
      formData.append('file', this.file);

      const url = this.enrichWithGoogle
        ? '/api/books/bulk-upload?enrich_with_google=true'
        : '/api/books/bulk-upload';

      // Usar el nuevo método upload que soporta reportProgress y observe
      this.progress = 0;

      this.apiClient
        .upload<BulkUploadResult>(url, formData, {
          reportProgress: true,
          observe: 'events',
        })
        .subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.UploadProgress) {
              if (event.total) {
                this.progress = Math.round((event.loaded * 100) / event.total);
              }
            } else if (event instanceof HttpResponse) {
              // Respuesta final del servidor
              this.result = event.body as BulkUploadResult;
            }
          },
          error: (err: any) => {
            this.error =
              err?.detail || err?.message || 'Error al cargar el archivo';
            this.uploading = false;
            this.progress = 0;
          },
          complete: () => {
            this.uploading = false;
            this.file = null;
            const fileInput = document.getElementById(
              'fileInput'
            ) as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            this.progress = 0;
          },
        });
    } catch (err: any) {
      this.error = err.detail || 'Error al cargar el archivo';
      this.uploading = false;
      this.progress = 0;
    }
  }

  downloadTemplate(): void {
    const csvContent = `title,author,isbn,description,category,publication_year,total_copies,available_copies
El Quijote,Miguel de Cervantes,9788424934484,Novela clásica española,Ficción,1605,5,5
Cien Años de Soledad,Gabriel García Márquez,9788497592208,Realismo mágico,Ficción,1967,3,3`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_libros.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  clearError(): void {
    this.error = '';
  }
}
