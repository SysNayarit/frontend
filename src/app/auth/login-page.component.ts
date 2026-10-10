import { Component } from '@angular/core';

import { LoginComponent } from './login.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    LoginComponent,
  ],
  template: `
    <main
      class="min-h-screen bg-slate-100 text-slate-900"
    >
      <div
        class="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8"
      >
        <div
          class="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200 lg:grid-cols-2"
        >
          <section
            class="flex flex-col justify-between bg-slate-900 p-8 text-white sm:p-10 lg:p-12"
          >
            <div>
              <div
                class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold ring-1 ring-white/15"
                aria-hidden="true"
              >
                S
              </div>

              <p
                class="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300"
              >
                Sistema Integral de Gestión Académica
              </p>

              <h1
                class="mt-4 text-4xl font-bold tracking-tight sm:text-5xl"
              >
                SIGA
              </h1>

              <p
                class="mt-4 max-w-md text-lg leading-8 text-slate-300"
              >
                Plataforma Integral para la gestión segura de información
                académica e institucional.
              </p>
            </div>

            <div
              class="mt-12 border-t border-white/10 pt-6 text-sm leading-6 text-slate-400"
            >
              <p>
                Acceso exclusivo para usuarios autorizados.
              </p>

              <p class="mt-1">
                La autenticación y autorización son validadas por el backend.
              </p>
            </div>
          </section>

          <section
            class="flex items-center p-8 sm:p-10 lg:p-12"
          >
            <div class="w-full">
              <div class="mb-8">
                <p
                  class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  Plataforma Integral
                </p>

                <h2
                  class="mt-2 text-3xl font-bold tracking-tight text-slate-900"
                >
                  Iniciar sesión
                </h2>

                <p
                  class="mt-3 text-sm leading-6 text-slate-600"
                >
                  Ingresa tus credenciales institucionales para continuar.
                </p>
              </div>

              <app-login />
            </div>
          </section>
        </div>
      </div>
    </main>
  `,
})
export class LoginPageComponent {}
