import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { SocketService } from '../../services/socket.service';
import { NotificationService } from '../../services/notification.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  currentUser: any = null;
  cartCount: number = 0;
  notificationCount: number = 0;
  latestNotification: string = '';
  menuOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private socketService: SocketService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Track chat notification count from the shared service
    this.notificationService.chatCount$.subscribe(count => {
      this.notificationCount = count;
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (this.currentUser) {
        this.socketService.listen(`notification:${this.currentUser._id}`).subscribe((data: any) => {
          // Only increment the Messages badge for chat notifications
          if (data.type === 'chat' && !this.router.url.startsWith('/chat')) {
            this.notificationService.increment();
          }
          this.latestNotification = data.message;
          setTimeout(() => this.latestNotification = '', 5000);
        });
      }
    });

    this.cartService.cart$.subscribe(() => {
      this.cartCount = this.cartService.getTotalItems();
    });

    // Auto-clear chat badge when user navigates to /chat
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      if (e.urlAfterRedirects === '/chat' || e.url === '/chat') {
        this.notificationService.clearChat();
      }
    });
  }

  clearNotifications() {
    this.notificationService.clearChat();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
