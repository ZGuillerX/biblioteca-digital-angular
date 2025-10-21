import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="App">
      <app-navbar></app-navbar>
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Biblioteca Digital';
}
