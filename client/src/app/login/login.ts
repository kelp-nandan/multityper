import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user?: {
      id: number;
      name: string;
      email: string;
    };
    accessToken?: string;
    refreshToken?: string;
  };
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8)
      ]]
    });
  }

  toggleMode() {
    this.isLoginMode.set(!this.isLoginMode());
    this.clearMessages();
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.clearMessages();

      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success && response.data.user) {
            this.authService.setUserData(response.data.user);
            this.successMessage.set('Login successful! Redirecting...');
            this.router.navigate(['/homepage']);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Login failed');
        }
      });
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.clearMessages();

      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success) {
            this.successMessage.set('Registration successful! Please login.');
            this.isLoginMode.set(true);
            this.registerForm.reset();
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Registration failed');
        }
      });
    }
  }

  private clearMessages() {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  getFieldError(form: FormGroup, field: string): string {
    const control = form.get(field);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${field} is required`;
      if (control.errors['email']) return 'Invalid email format';
      if (control.errors['minlength']) return `${field} must be at least ${control.errors['minlength'].requiredLength} characters`;
      if (control.errors['pattern']) {
        if (field === 'password' && form === this.registerForm) {
          return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
        }
      }
    }
    return '';
  }
}