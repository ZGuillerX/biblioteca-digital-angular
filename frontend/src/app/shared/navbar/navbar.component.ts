import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService,User } from 'src/app/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  isAuthenticated = false;
  user: User | null = null;
  isCollapsed = true;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(
      (isAuth) => (this.isAuthenticated = isAuth)
    );

    this.authService.currentUser$.subscribe((user) => (this.user = user));
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  toggleNavbar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
