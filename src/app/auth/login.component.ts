import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
  ],
  template: `
    <form
      class="space-y-6"
      [formGroup]="form"
      (ngSubmit)="submit()"
      novalidate
    >
      <div>
        <label
          for="email"
          class="block text-sm font-semibold text-slate-800"
        >
          Correo electrónico
        </label>

        <input
          id="email"
          type="email"
          formControlName="email"
          autocomplete="username"
          inputmode="email"
          class="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          placeholder="usuario@institucion.mx"
          [attr.aria-invalid]="
            form.controls.email.invalid &&
            form.controls.email.touched
          "
          aria-describedby="email-help"
        />

        <div
          id="email-help"
          class="mt-2 min-h-5 text-sm"
        >
          @if (
            form.controls.email.touched &&
            form.controls.email.hasError('required')
          ) {
            <p class="text-red-700">
              El correo electrónico es obligatorio.
            </p>
          } @else if (
            form.controls.email.touched &&
            form.controls.email.hasError('email')
          ) {
            <p class="text-red-700">
              Ingresa un correo electrónico válido.
            </p>
          }
        </div>
      </div>

      <div>
        <label
          for="password"
          class="block text-sm font-semibold text-slate-800"
        >
          Contraseña
        </label>

        <input
          id="password"
          type="password"
          formControlName="password"
          autocomplete="current-password"
          class="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          placeholder="Ingresa tu contraseña"
          [attr.aria-invalid]="
            form.controls.password.invalid &&
            form.controls.password.touched
          "
          aria-describedby="password-help"
        />

        <div
          id="password-help"
          class="mt-2 min-h-5 text-sm"
        >
          @if (
            form.controls.password.touched &&
            form.controls.password.hasError('required')
          ) {
            <p class="text-red-700">
              La contraseña es obligatoria.
            </p>
          }
        </div>
      </div>

      @if (errorMessage()) {
        <div
          role="alert"
          aria-live="polite"
          class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
        >
          {{ errorMessage() }}
        </div>
      }

      <button
        type="submit"
        [disabled]="isSubmitting()"
        class="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        @if (isSubmitting()) {
          <span
            class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
            aria-hidden="true"
          ></span>

          Iniciando sesión...
        } @else {
          Iniciar sesión
        }
      </button>

      <p
        class="text-center text-xs leading-5 text-slate-500"
      >
        No compartas tus credenciales con otras personas.
      </p>
    </form>
  `,
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
      ],
    ],
    password: [
      '',
      [
        Validators.required,
      ],
    ],
  });

  submit(): void {
    if (
      this.form.invalid ||
      this.isSubmitting()
    ) {
      this.form.markAllAsTouched();

      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.auth.login(
      this.form.getRawValue(),
    )
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/inicio');
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            this.resolveErrorMessage(error),
          );
        },
      });
  }

  private resolveErrorMessage(
    error: unknown,
  ): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.responseMessage(
        error,
      );

      if (
        error.status === 429 &&
        message !== null
      ) {
        const retryAfter = this.retryAfterSeconds(
          error,
        );

        if (retryAfter !== null) {
          return `${message} Inténtalo nuevamente en ${retryAfter} segundos.`;
        }
      }

      if (message !== null) {
        return message;
      }
    }

    return 'No fue posible iniciar sesión. Inténtalo nuevamente.';
  }

  private responseMessage(
    error: HttpErrorResponse,
  ): string | null {
    if (
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return null;
  }

  private retryAfterSeconds(
    error: HttpErrorResponse,
  ): number | null {
    const header = error.headers.get(
      'Retry-After',
    );

    if (header === null) {
      return null;
    }

    const seconds = Number.parseInt(
      header,
      10,
    );

    if (
      !Number.isInteger(seconds) ||
      seconds <= 0
    ) {
      return null;
    }

    return seconds;
  }
}
