import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';
import { PricePipe } from '../../pipes/price.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-products',
  standalone: true,
  imports: [CommonModule, FormsModule, PricePipe],
  templateUrl: './my-products.component.html',
  styleUrl: './my-products.component.css'
})
export class MyProductsComponent implements OnInit {
  products: any[] = [];
  currentUser: any = null;
  showAddForm = false;
  newProduct = { name: '', description: '', price: 0, stock: 1, category: '', imageUrl: '' };
  customCategory = '';
  isEditing = false;
  editingProductId: string | null = null;
  loading = false;
  
  categories = [
    'Electronics & Gadgets', 'Computers & Accessories', 'Smartphones & Tablets',
    'Fashion & Apparel', 'Home & Kitchen', 'Health & Beauty', 'Sports & Outdoors',
    'Books & Media', 'Toys & Games', 'Automotive', 'Pet Supplies', 'Office Supplies', 'Other'
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private uiService: UiService
  ) {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
  }

  ngOnInit() {
    this.loadMyProducts();
  }

  loadMyProducts() {
    this.apiService.getProducts().subscribe({
      next: (data) => {
        // Filter to show only the current user's products
        if (this.currentUser) {
          this.products = data.filter((p: any) => p.sellerId?._id === this.currentUser._id);
        }
      },
      error: (err) => console.error('Failed to load my products', err)
    });
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  resetForm() {
    this.isEditing = false;
    this.editingProductId = null;
    this.newProduct = { name: '', description: '', price: 0, stock: 1, category: '', imageUrl: '' };
    this.customCategory = '';
  }

  addProduct() {
    this.loading = true;
    const productToSave = { ...this.newProduct };
    if (productToSave.category === 'Other' && this.customCategory.trim()) {
      productToSave.category = this.customCategory.trim();
    }

    if (this.isEditing && this.editingProductId) {
      this.apiService.updateProduct(this.editingProductId, productToSave).subscribe({
        next: (updated) => {
          this.showAddForm = false;
          this.resetForm();
          this.loading = false;
          const index = this.products.findIndex(p => p._id === updated._id);
          if (index !== -1) this.products[index] = updated;
          this.uiService.showToast('Product updated successfully', 'success');
        },
        error: (err) => {
          this.uiService.showToast('Failed to update product', 'error');
          this.loading = false;
        }
      });
    } else {
      this.apiService.createProduct(productToSave).subscribe({
        next: (created) => {
          this.showAddForm = false;
          this.resetForm();
          this.loading = false;
          this.products.push(created);
          this.uiService.showToast('Product created successfully', 'success');
        },
        error: (err) => {
          this.uiService.showToast('Failed to create product', 'error');
          this.loading = false;
        }
      });
    }
  }

  editProduct(product: any) {
    this.isEditing = true;
    this.editingProductId = product._id;
    this.newProduct = { ...product };
    if (!this.categories.includes(product.category)) {
      this.newProduct.category = 'Other';
      this.customCategory = product.category;
    }
    this.showAddForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteProduct(productId: string) {
    const confirmed = await this.uiService.confirm('Are you sure you want to delete this product?');
    if (confirmed) {
      this.apiService.deleteProduct(productId).subscribe({
        next: () => {
          this.products = this.products.filter(p => p._id !== productId);
          this.uiService.showToast('Product deleted', 'success');
        },
        error: (err) => this.uiService.showToast('Failed to delete product', 'error')
      });
    }
  }

  getInStockCount(): number {
    return this.products.filter(p => p.stock > 0).length;
  }

  getOutOfStockCount(): number {
    return this.products.filter(p => p.stock === 0).length;
  }
}
