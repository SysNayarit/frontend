import { Component, inject } from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { LoginComponent } from './login.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    LoginComponent,
  ],
  template: `
    <main
      class="siga-texture min-h-screen bg-[#f7f7f5] text-[#161a1d]"
    >
      <header
        class="w-full overflow-hidden border-b border-[#a57f2c]/30 bg-white shadow-sm"
      >
        <img
          src="/branding/sesnsp-2026-banner.jpg"
          alt="Identidad institucional de la Secretaría de Seguridad y del Secretariado Ejecutivo del Sistema Nacional de Seguridad Pública"
          class="block h-auto w-full"
        />
      </header>

      <div
        class="mx-auto flex max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:min-h-[calc(100vh-9rem)] lg:px-8"
      >
        <div
          class="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <section
            class="relative overflow-hidden bg-[#611232] p-8 text-white sm:p-10 lg:p-12"
          >
            <div
              class="absolute inset-0 opacity-10"
              style="background-image: url('/branding/textura-institucional-gris.jpg'); background-size: cover;"
              aria-hidden="true"
            ></div>

            <div
              class="relative flex h-full min-h-[28rem] flex-col justify-between"
            >
              <div>
                <div
                  class="inline-flex items-center gap-3 rounded-full border border-[#e6d194]/40 bg-white/10 px-4 py-2 text-sm font-semibold text-[#e6d194]"
                >
                  Plataforma Integral
                </div>

                <h1
                  class="siga-title mt-8 text-5xl font-bold tracking-tight sm:text-6xl"
                >
                  SIGA
                </h1>

                <p
                  class="mt-3 text-xl font-semibold text-[#e6d194]"
                >
                  Sistema Integral de Gestión Académica
                </p>

                <div
                  class="mt-8 h-1 w-16 rounded-full bg-[#a57f2c]"
                  aria-hidden="true"
                ></div>

                <p
                  class="mt-8 max-w-lg text-lg leading-8 text-white/90"
                >
                  Plataforma institucional para la gestión segura,
                  ordenada y trazable de los procesos académicos.
                </p>
              </div>

              <div
                class="mt-12 border-t border-[#e6d194]/25 pt-6"
              >
                <p
                  class="text-sm font-semibold uppercase tracking-[0.16em] text-[#e6d194]"
                >
                  Acceso institucional
                </p>

                <p
                  class="mt-2 max-w-lg text-sm leading-6 text-white/70"
                >
                  Uso exclusivo para personas autorizadas.
                  La autenticación y los permisos son validados
                  por los servicios de SIGA.
                </p>
              </div>
            </div>
          </section>

          <section
            class="flex items-center bg-white p-8 sm:p-10 lg:p-12"
          >
            <div class="mx-auto w-full max-w-md">
              <p
                class="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b2247]"
              >
                Plataforma Integral
              </p>

              <h2
                class="siga-title mt-3 text-4xl font-bold tracking-tight text-[#611232]"
              >
                Bienvenido a SIGA
              </h2>

              <p
                class="mt-3 text-sm leading-6 text-[#4d4d4d]"
              >
                Ingresa tus credenciales institucionales para continuar.
              </p>

              <div
                class="my-8 h-px bg-gradient-to-r from-[#a57f2c] via-[#e6d194] to-transparent"
                aria-hidden="true"
              ></div>

              @if (sessionEnded) {
                <p role="status" data-testid="session-ended" class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  La sesión finalizó o el acceso de la cuenta fue revocado. Ingresa nuevamente; si no puedes acceder, contacta al administrador.
                </p>
              }
              <app-login />

              <footer
                class="mt-8 border-t border-[#98989a]/25 pt-5 text-center"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.14em] text-[#98989a]"
                >
                  Gobierno de México · Seguridad · SESNSP
                </p>
              </footer>
            </div>
          </section>
        </div>
      </div>
    </main>
  `,
})
export class LoginPageComponent {
  private readonly route = inject(ActivatedRoute);
  get sessionEnded(): boolean {
    return this.route.snapshot.queryParamMap.get('estado') === 'sesion-finalizada';
  }
}
