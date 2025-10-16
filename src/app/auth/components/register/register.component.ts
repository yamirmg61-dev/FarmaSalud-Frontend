import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'] // o .css según tu archivo real
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  message = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      dni: [''],
      address: [''],
      phone: ['']
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.error = 'Por favor completa todos los campos requeridos.';
      return;
    }

    this.error = '';
    this.message = '';
    this.loading = true;

    const payload = this.registerForm.value;

    this.authService.registerClient(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.message = '✅ Registro exitoso. Redirigiendo al inicio de sesión...';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          this.error = err.message || '❌ Error durante el registro.';
        }
      });
  }
}
