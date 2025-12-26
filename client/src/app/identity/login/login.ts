import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  loginForm: FormGroup;
  registerForm: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  toggleMode(): void {
    this.isLoginMode.set(!this.isLoginMode());
    this.clearMessages();
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.clearMessages();

      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.data?.user) {
            this.authService.setUserData(response.data.user);
            this.successMessage.set('Login successful! Redirecting...');
            this.router.navigate(['/homepage']);
          } else {
            this.errorMessage.set('Login failed - no user data received');
          }
        },
        error: (error) => {
          this.isLoading.set(false);

          const message = this.getErrorMessage(error);
          this.errorMessage.set(message);
        },
      });
    }
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.clearMessages();

      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.successMessage.set('Registration successful! Please login.');
          this.isLoginMode.set(true);
          this.registerForm.reset();
        },
        error: (error) => {
          this.isLoading.set(false);

          const message = this.getErrorMessage(error);
          this.errorMessage.set(message);
        },
      });
    }
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  getFieldError(form: FormGroup, field: string): string {
    const control = form.get(field);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${field} is required`;
      if (control.errors['email']) return 'Invalid email format';
      if (control.errors['minlength'])
        return `${field} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  private getErrorMessage(error: { status?: number; error?: { message?: string } }): string {
    return error.error?.message || 'Please try again';
  }
}
