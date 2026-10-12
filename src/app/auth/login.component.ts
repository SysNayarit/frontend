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
      class="space-y-5"
      [formGroup]="form"
      (ngSubmit)="submit()"
      novalidate
    >
      <div>
        <label
          for="email"
          class="block text-sm font-semibold text-[#161a1d]"
        >
          Correo electrónico
        </label>

        <input
          id="email"
          type="email"
          formControlName="email"
          autocomplete="username"
          inputmode="email"
          class="siga-focus mt-2 block w-full rounded-xl border border-[#98989a]/50 bg-white px-4 py-3 text-[#161a1d] shadow-sm outline-none transition placeholder:text-[#98989a] hover:border-[#a57f2c] focus:border-[#611232] focus:ring-4 focus:ring-[#611232]/10"
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
            <p class="font-medium text-[#9b2247]">
              El correo electrónico es obligatorio.
            </p>
          } @else if (
            form.controls.email.touched &&
            form.controls.email.hasError('email')
          ) {
            <p class="font-medium text-[#9b2247]">
              Ingresa un correo electrónico válido.
            </p>
          }
        </div>
      </div>

      <div>
        <label
          for="password"
          class="block text-sm font-semibold text-[#161a1d]"
        >
          Contraseña
        </label>

        <input
          id="password"
          type="password"
          formControlName="password"
          autocomplete="current-password"
          class="siga-focus mt-2 block w-full rounded-xl border border-[#98989a]/50 bg-white px-4 py-3 text-[#161a1d] shadow-sm outline-none transition placeholder:text-[#98989a] hover:border-[#a57f2c] focus:border-[#611232] focus:ring-4 focus:ring-[#611232]/10"
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
            <p class="font-medium text-[#9b2247]">
              La contraseña es obligatoria.
            </p>
          }
        </div>
      </div>

      @if (errorMessage()) {
        <div
          role="alert"
          aria-live="polite"
          class="rounded-xl border border-[#9b2247]/25 bg-[#9b2247]/5 px-4 py-3 text-sm leading-6 text-[#611232]"
        >
          {{ errorMessage() }}
        </div>
      }

      <button
        type="submit"
        [disabled]="isSubmitting()"
        class="siga-focus flex w-full items-center justify-center rounded-xl bg-[#611232] px-4 py-3.5 font-semibold text-white shadow-md transition hover:bg-[#9b2247] disabled:cursor-not-allowed disabled:bg-[#98989a]"
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

      <div
        class="flex items-center justify-center gap-3 pt-2"
        aria-hidden="true"
      >
        <span class="h-px flex-1 bg-[#e6d194]"></span>
        <span class="h-2 w-2 rotate-45 bg-[#a57f2c]"></span>
        <span class="h-px flex-1 bg-[#e6d194]"></span>
      </div>

      <p
        class="text-center text-xs leading-5 text-[#6b6b6b]"
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
