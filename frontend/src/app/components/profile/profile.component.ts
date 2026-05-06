import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  currentUser: any = null;

  profileData = {
    email: '',
    shippingAddress: '',
    password: '',
    confirmPassword: ''
  };
  
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileData.email = user.email || '';
        this.profileData.shippingAddress = user.shippingAddress || '';
      }
    });
  }

  updateProfile() {
    this.successMessage = '';
    this.errorMessage = '';
    
    if (this.profileData.password && this.profileData.password !== this.profileData.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    this.loading = true;

    const dataToSubmit: any = {
      email: this.profileData.email,
      shippingAddress: this.profileData.shippingAddress
    };

    if (this.profileData.password) {
      dataToSubmit.password = this.profileData.password;
    }

    this.apiService.updateProfile(dataToSubmit).subscribe({
      next: (updatedUser) => {
        // Update local storage and auth service state
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (updatedUser.token) {
          localStorage.setItem('token', updatedUser.token);
        }
        
        // Push the new user state to BehaviorSubject
        this.authService.updateCurrentUser(updatedUser);
        
        this.successMessage = 'Profile updated successfully!';
        this.profileData.password = '';
        this.profileData.confirmPassword = '';
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to update profile: ' + err.message;
        this.loading = false;
      }
    });
  }
}
