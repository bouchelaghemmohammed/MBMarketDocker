import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit, OnDestroy {
  allProducts: any[] = [];
  filteredProducts: any[] = [];
  currentUser: any = null;
  
  searchQuery = '';
  selectedCategory = '';
  
  categories = [
    'Electronics & Gadgets', 'Computers & Accessories', 'Smartphones & Tablets',
    'Fashion & Apparel', 'Home & Kitchen', 'Health & Beauty', 'Sports & Outdoors',
    'Books & Media', 'Toys & Games', 'Automotive', 'Pet Supplies', 'Office Supplies', 'Other'
  ];

  private productCreatedSub!: Subscription;
  private productUpdatedSub!: Subscription;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private socketService: SocketService,
    private router: Router
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.applyFilters(); // Re-filter if user changes (to hide their own products)
    });
  }

  ngOnInit() {
    this.loadProducts();

    // Listen to real-time events
    this.productCreatedSub = this.socketService.listen('product:created').subscribe(product => {
      this.allProducts.push(product);
      this.applyFilters();
    });

    this.productUpdatedSub = this.socketService.listen('product:updated').subscribe(updatedProduct => {
      const index = this.allProducts.findIndex(p => p._id === updatedProduct._id);
      if (index !== -1) {
        this.allProducts[index] = updatedProduct;
        this.applyFilters();
      }
    });
  }

  loadProducts() {
    this.apiService.getProducts().subscribe({
      next: (data) => {
        this.allProducts = data;
        this.applyFilters();
      },
      error: (err) => console.error('Failed to load products', err)
    });
  }

  applyFilters() {
    let temp = this.allProducts;

    // 1. Hide out of stock
    temp = temp.filter(p => p.stock > 0);

    // 2. Hide current user's own products
    if (this.currentUser) {
      temp = temp.filter(p => p.sellerId?._id !== this.currentUser._id);
    }

    // 3. Category Filter
    if (this.selectedCategory) {
      temp = temp.filter(p => p.category === this.selectedCategory);
    }

    // 4. Search Filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    this.filteredProducts = temp;
  }

  viewDetails(productId: string) {
    this.router.navigate(['/product', productId]);
  }

  showScrollTop = false;

  @HostListener('window:scroll')
  onWindowScroll() {
    this.showScrollTop = window.scrollY > 320;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy() {
    if (this.productCreatedSub) this.productCreatedSub.unsubscribe();
    if (this.productUpdatedSub) this.productUpdatedSub.unsubscribe();
  }
}
