import {
  Component,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <main
      class="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 lg:px-8"
    >
      <div
        class="mx-auto max-w-7xl"
      >
        <header
          class="rounded-2xl bg-slate-900 px-6 py-5 text-white shadow-lg sm:px-8"
        >
          <p
            class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300"
          >
            Plataforma Integral
          </p>

          <div
            class="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
          >
            <div>
              <h1
                class="text-3xl font-bold tracking-tight"
              >
                SIGA
              </h1>

              <p
                class="mt-2 text-sm text-slate-300"
              >
                Sistema Integral de Gestión Académica
              </p>
            </div>

            <div
              class="flex items-center gap-4"
            >
              <p
                class="text-sm font-medium text-slate-300"
              >
                Sesión iniciada
              </p>

              <button
                type="button"
                data-testid="logout-button"
                (click)="logout()"
                class="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <section
          class="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8"
        >
          <p
            class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500"
          >
            Inicio
          </p>

          <h2
            class="mt-2 text-2xl font-bold tracking-tight"
          >
            Bienvenido a SIGA
          </h2>

          <p
            class="mt-3 max-w-2xl leading-7 text-slate-600"
          >
            La autenticación se completó correctamente.
            Los módulos disponibles se incorporarán de acuerdo
            con los permisos asignados al usuario.
          </p>
        </section>
      </div>
    </main>
  `,
})
export class HomeComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        void this.router.navigateByUrl('/login');
      },
    });
  }
}
