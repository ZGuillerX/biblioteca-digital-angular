import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  // styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  formData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  };

  error = '';
  success = false;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  validateForm(): boolean {
    if (this.formData.password !== this.formData.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return false;
    }

    if (this.formData.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    if (!/[A-Za-z]/.test(this.formData.password) || !/[0-9]/.test(this.formData.password)) {
      this.error = 'La contraseña debe contener letras y números';
      return false;
    }

    return true;
  }

  async onSubmit(): Promise<void> {
    this.error = '';
    this.success = false;

    if (!this.validateForm()) {
      return;
    }

    this.loading = true;

    try {
      const userData = {
        username: this.formData.username,
        email: this.formData.email,
        password: this.formData.password,
        full_name: this.formData.full_name,
        role: 'usuario'
      };

      const result = await this.authService.register(userData);

      if (result.success) {
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      } else {
        this.error = result.error?.detail || 'Error al registrar usuario';
      }
    } catch (err: any) {
      this.error = 'Error de conexión con el servidor';
    } finally {
      this.loading = false;
    }
  }
}