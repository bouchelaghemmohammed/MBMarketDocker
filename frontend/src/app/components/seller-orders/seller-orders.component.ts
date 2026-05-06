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
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, PricePipe],
  templateUrl: './seller-orders.component.html',
  styleUrl: './seller-orders.component.css'
})
export class SellerOrdersComponent implements OnInit, OnDestroy {
  orders: any[] = [];
  loading = true;
  updatingOrderId: string | null = null;
  currentUser: any = null;
  private statusUpdatedSub!: Subscription;

  // Status flow the seller can drive
  readonly nextStatusLabel: Record<string, string> = {
    pending:   'Confirm Order',
    confirmed: 'Mark as Shipped',
    shipped:   'Mark as Delivered'
  };

  readonly nextStatus: Record<string, string> = {
    pending:   'confirmed',
    confirmed: 'shipped',
    shipped:   'delivered'
  };

  private readonly statusOrder = ['pending', 'confirmed', 'shipped', 'delivered', 'received'];

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

  isStepDone(step: string, current: string): boolean {
    return this.statusOrder.indexOf(current) > this.statusOrder.indexOf(step);
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private socketService: SocketService,
    private uiService: UiService
  ) {
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
  }

  ngOnInit() {
    this.loadOrders();

    // Real-time: refresh when any order status changes
    this.statusUpdatedSub = this.socketService.listen('order:statusUpdated').subscribe((data: any) => {
      const idx = this.orders.findIndex(o => o._id === data._id);
      if (idx !== -1) {
        this.orders[idx].status = data.status;
      }
    });
  }

  loadOrders() {
    this.loading = true;
    this.apiService.getSellerOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  advanceStatus(order: any) {
    const next = this.nextStatus[order.status];
    if (!next) return;
    this.updatingOrderId = order._id;
    this.apiService.updateOrderStatus(order._id, next).subscribe({
      next: (updated) => {
        order.status = updated.status;
        this.updatingOrderId = null;
        this.uiService.showToast(`Order marked as ${updated.status}`, 'success');
      },
      error: () => {
        this.updatingOrderId = null;
        this.uiService.showToast('Failed to update status', 'error');
      }
    });
  }

  /** Returns only the products in this order that belong to the logged-in seller */
  myItems(order: any): any[] {
    if (!this.currentUser) return order.products;
    return order.products.filter((item: any) =>
      item.productId?.sellerId?._id === this.currentUser._id ||
      item.productId?.sellerId === this.currentUser._id
    );
  }

  trackById(_: number, item: any) { return item._id; }

  ngOnDestroy() {
    if (this.statusUpdatedSub) this.statusUpdatedSub.unsubscribe();
  }
}
