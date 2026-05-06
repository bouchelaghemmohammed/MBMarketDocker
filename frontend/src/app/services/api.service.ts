import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // Products
  getProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/products`);
  }

  getProduct(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${id}`);
  }

  createProduct(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, data, this.getHeaders());
  }

  updateProduct(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${id}`, data, this.getHeaders());
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`, this.getHeaders());
  }

  // Orders
  getOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders`, this.getHeaders());
  }

  getSellerOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/seller`, this.getHeaders());
  }

  createOrder(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, data, this.getHeaders());
  }

  updateOrderStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}`, { status }, this.getHeaders());
  }

  // Profile
  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/profile`, data, this.getHeaders());
  }

  getUser(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/user/${id}`, this.getHeaders());
  }

  // Chat
  getContacts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/contacts`, this.getHeaders());
  }

  getMessages(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/${userId}`, this.getHeaders());
  }

  sendMessage(receiverId: string, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat`, { receiverId, content }, this.getHeaders());
  }
}
