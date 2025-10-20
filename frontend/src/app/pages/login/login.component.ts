import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  // styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(): Promise<void> {
    this.error = '';
    this.loading = true;

    try {
      const result = await this.authService.login(this.username, this.password);

      if (result.success) {
        this.router.navigate(['/']);
      } else {
        this.error = result.error?.detail || 'Error al iniciar sesión';
      }
    } catch (err: any) {
      this.error = 'Error de conexión con el servidor';
    } finally {
      this.loading = false;
    }
  }
}