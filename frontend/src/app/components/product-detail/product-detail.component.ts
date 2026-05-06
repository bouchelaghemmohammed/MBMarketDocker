import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { UiService } from '../../services/ui.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: any = null;
  currentUser: any = null;
  loading = true;
  quantity = 1;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private authService: AuthService,
    private cartService: CartService,
    private uiService: UiService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: string) {
    this.apiService.getProduct(id).subscribe({
      next: (data) => {
        this.product = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load product', err);
        this.uiService.showToast('Product not found', 'error');
        this.loading = false;
      }
    });
  }

  goBack() {
    this.location.back();
  }

  addToCart() {
    if (!this.currentUser) {
      this.uiService.showToast('Please log in to add items to cart.', 'error');
      this.router.navigate(['/login']);
      return;
    }
    
    if (this.quantity > this.product.stock) {
      this.uiService.showToast('Quantity exceeds available stock.', 'error');
      return;
    }

    this.cartService.addToCart(this.product, this.quantity);
    this.uiService.showToast(`Added ${this.quantity} ${this.product.name} to cart!`, 'success');
  }

  messageSeller() {
    if (!this.currentUser) {
      this.uiService.showToast('Please log in to message the seller.', 'error');
      this.router.navigate(['/login']);
      return;
    }
    
    // Navigate to chat with sellerId as query parameter to auto-start chat
    this.router.navigate(['/chat'], { queryParams: { user: this.product.sellerId._id } });
  }
}
