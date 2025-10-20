import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  template: `
    <div class="container mt-5 text-center">
      <h1 class="display-1">404</h1>
      <p class="lead">Página no encontrada</p>
      <a routerLink="/" class="btn btn-primary">Volver al Inicio</a>
    </div>
  `,
  styles: [
    `
      .container {
        min-height: 60vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    `,
  ],
})
export class NotFoundComponent {}
