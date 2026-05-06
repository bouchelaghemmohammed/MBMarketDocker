import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { UiService } from '../../services/ui.service';
import { PricePipe } from '../../pipes/price.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, PricePipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: any[] = [];
  loading = true;
  updatingOrderId: string | null = null;
  private orderCreatedSub!: Subscription;
  private statusUpdatedSub!: Subscription;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private socketService: SocketService,
    private uiService: UiService
  ) {}

  ngOnInit() {
    this.loadOrders();

    this.orderCreatedSub = this.socketService.listen('order:created').subscribe(() => {
      this.loadOrders();
    });

    // Real-time status update — patch in place, no full reload
    this.statusUpdatedSub = this.socketService.listen('order:statusUpdated').subscribe((data: any) => {
      const idx = this.orders.findIndex(o => o._id === data._id);
      if (idx !== -1) {
        this.orders[idx].status = data.status;
      }
    });
  }

  loadOrders() {
    this.loading = true;
    this.apiService.getOrders().subscribe({
      next: (data) => {
        this.orders = data.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  markAsReceived(order: any) {
    this.updatingOrderId = order._id;
    this.apiService.updateOrderStatus(order._id, 'received').subscribe({
      next: (updated) => {
        order.status = updated.status;
        this.updatingOrderId = null;
        this.uiService.showToast('Order marked as received!', 'success');
      },
      error: () => {
        this.updatingOrderId = null;
        this.uiService.showToast('Failed to update order', 'error');
      }
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending:   'Pending',
      confirmed: 'Confirmed',
      shipped:   'Shipped',
      delivered: 'Delivered',
      received:  'Received'
    };
    return labels[status] || status;
  }

  ngOnDestroy() {
    if (this.orderCreatedSub) this.orderCreatedSub.unsubscribe();
    if (this.statusUpdatedSub) this.statusUpdatedSub.unsubscribe();
  }
}

