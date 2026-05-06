import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { CartService, CartItem } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';
import { PricePipe } from '../../pipes/price.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PricePipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalPrice: number = 0;

  readonly TPS_RATE = 0.05;
  readonly TVQ_RATE = 0.09975;

  get subtotal(): number { return this.totalPrice; }
  get tps(): number { return this.subtotal * this.TPS_RATE; }
  get tvq(): number { return this.subtotal * this.TVQ_RATE; }
  get grandTotal(): number { return this.subtotal + this.tps + this.tvq; }
  
  checkoutData = {
    shippingAddress: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  };
  
  loading = false;

  constructor(
    private cartService: CartService,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private location: Location,
    private uiService: UiService
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.totalPrice = this.cartService.getTotalPrice();
    });

    this.authService.currentUser$.subscribe(user => {
      if (user && user.shippingAddress) {
        this.checkoutData.shippingAddress = user.shippingAddress;
      }
    });
  }

  goBack() {
    this.location.back();
  }

  async removeItem(productId: string) {
    const confirmed = await this.uiService.confirm('Remove this item from your cart?');
    if (confirmed) {
      this.cartService.removeFromCart(productId);
    }
  }

  updateQuantity(productId: string, currentQty: number, change: number, maxStock: number) {
    const newQty = currentQty + change;
    if (newQty > 0 && newQty <= maxStock) {
      this.cartService.updateQuantity(productId, newQty);
    } else if (newQty === 0) {
      this.removeItem(productId);
    } else if (newQty > maxStock) {
      this.uiService.showToast('Cannot exceed available stock limit.', 'error');
    }
  }

  placeOrder(form?: NgForm) {
    if (form) form.form.markAllAsTouched();
    if (this.cartItems.length === 0) return;
    if (form && form.form.invalid) return;
    
    this.loading = true;
    const orderData = {
      products: this.cartItems.map(item => ({
        productId: item.product._id,
        quantity: item.quantity
      })),
      totalAmount: this.grandTotal
    };

    this.apiService.createOrder(orderData).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.uiService.showToast('Order placed successfully! The sellers have been notified.', 'success');
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        console.error('Checkout failed', err);
        this.uiService.showToast('Failed to place order: ' + err.message, 'error');
        this.loading = false;
      }
    });
  }
}
