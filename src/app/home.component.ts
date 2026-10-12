import {
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import {
  AuthenticatedUser,
} from './auth/auth.models';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
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

      <section
        class="border-b border-[#a57f2c]/20 bg-[#611232] text-white shadow-md"
      >
        <div
          class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8"
        >
          <div>
            <div
              class="flex items-center gap-3"
            >
              <span
                class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#e6d194]/40 bg-white/10 text-lg font-bold text-[#e6d194]"
                aria-hidden="true"
              >
                S
              </span>

              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-[#e6d194]"
                >
                  Plataforma Integral
                </p>

                <h1
                  class="siga-title mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
                >
                  SIGA
                </h1>
              </div>
            </div>

            <p
              class="mt-3 text-sm text-white/75"
            >
              Sistema Integral de Gestión Académica
            </p>
          </div>

          <div
            class="flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            @if (user()) {
              <div
                class="rounded-xl border border-white/15 bg-white/5 px-4 py-3 sm:text-right"
              >
                <p
                  class="text-sm font-semibold text-white"
                >
                  {{ displayName() }}
                </p>

                <p
                  class="mt-1 text-xs text-white/65"
                >
                  {{ user()?.email }}
                </p>
              </div>
            }

            <button
              type="button"
              data-testid="logout-button"
              (click)="logout()"
              class="siga-focus rounded-xl border border-[#e6d194]/50 bg-transparent px-5 py-3 text-sm font-semibold text-[#e6d194] transition hover:bg-white/10"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </section>

      <div
        class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      >
        <div
          class="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]"
        >
          <aside>
            <nav
              aria-label="Navegación principal"
              class="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
            >
              <div
                class="border-b border-[#a57f2c]/20 px-5 py-5"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-[#98989a]"
                >
                  Navegación
                </p>
              </div>

              <div class="p-3">
                <div
                  class="flex items-center gap-3 rounded-xl bg-[#611232] px-4 py-3 font-semibold text-white shadow-sm"
                  aria-current="page"
                >
                  <span
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[#e6d194]"
                    aria-hidden="true"
                  >
                    ●
                  </span>

                  Inicio
                </div>
              </div>

              <div
                class="border-t border-[#98989a]/20 px-5 py-5"
              >
                <p
                  class="text-xs leading-5 text-[#6b6b6b]"
                >
                  Los módulos se habilitarán conforme sean
                  incorporados a la Plataforma Integral.
                </p>
              </div>
            </nav>
          </aside>

          <div class="space-y-6">
            <section
              class="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
            >
              <div
                class="h-1.5 bg-gradient-to-r from-[#611232] via-[#9b2247] to-[#a57f2c]"
                aria-hidden="true"
              ></div>

              <div
                class="p-6 sm:p-8"
              >
                <div
                  class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between"
                >
                  <div>
                    <p
                      class="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b2247]"
                    >
                      Inicio
                    </p>

                    <h2
                      class="siga-title mt-2 text-3xl font-bold tracking-tight text-[#611232] sm:text-4xl"
                    >
                      Bienvenido a SIGA
                    </h2>

                    <p
                      class="mt-4 max-w-2xl leading-7 text-[#555555]"
                    >
                      Sesión institucional activa en la Plataforma
                      Integral de Gestión Académica.
                    </p>
                  </div>

                  <div
                    class="inline-flex w-fit items-center gap-2 rounded-full border border-[#1e5b4f]/20 bg-[#1e5b4f]/10 px-4 py-2"
                  >
                    <span
                      class="h-2.5 w-2.5 rounded-full bg-[#1e5b4f]"
                      aria-hidden="true"
                    ></span>

                    <span
                      class="text-sm font-semibold text-[#1e5b4f]"
                    >
                      Sesión autenticada
                    </span>
                  </div>
                </div>

                @if (user()) {
                  <div
                    class="mt-8 grid gap-5 sm:grid-cols-2"
                  >
                    <article
                      class="rounded-2xl border border-[#98989a]/25 bg-[#f9f9f8] p-5"
                    >
                      <div
                        class="flex items-start gap-4"
                      >
                        <div
                          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#611232] font-bold text-[#e6d194]"
                          aria-hidden="true"
                        >
                          U
                        </div>

                        <div class="min-w-0">
                          <p
                            class="text-xs font-semibold uppercase tracking-[0.15em] text-[#98989a]"
                          >
                            Usuario
                          </p>

                          <p
                            class="mt-2 break-words text-lg font-semibold text-[#161a1d]"
                          >
                            {{ displayName() }}
                          </p>
                        </div>
                      </div>
                    </article>

                    <article
                      class="rounded-2xl border border-[#98989a]/25 bg-[#f9f9f8] p-5"
                    >
                      <div
                        class="flex items-start gap-4"
                      >
                        <div
                          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#a57f2c] font-bold text-white"
                          aria-hidden="true"
                        >
                          @
                        </div>

                        <div class="min-w-0">
                          <p
                            class="text-xs font-semibold uppercase tracking-[0.15em] text-[#98989a]"
                          >
                            Correo institucional
                          </p>

                          <p
                            class="mt-2 break-all text-lg font-semibold text-[#161a1d]"
                          >
                            {{ user()?.email }}
                          </p>
                        </div>
                      </div>
                    </article>
                  </div>
                }
              </div>
            </section>

            <section
              class="rounded-2xl border border-[#e6d194]/60 bg-white p-6 shadow-sm sm:p-8"
            >
              <div
                class="flex flex-col gap-5 sm:flex-row sm:items-center"
              >
                <div
                  class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e6d194]/35 text-2xl font-bold text-[#611232]"
                  aria-hidden="true"
                >
                  ✓
                </div>

                <div>
                  <h3
                    class="siga-title text-xl font-bold text-[#611232]"
                  >
                    Acceso institucional verificado
                  </h3>

                  <p
                    class="mt-2 max-w-3xl text-sm leading-6 text-[#555555]"
                  >
                    La sesión se encuentra autenticada. Las funciones
                    disponibles se incorporarán conforme avance el
                    desarrollo y serán validadas por los servicios
                    correspondientes de SIGA.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer
        class="border-t border-[#a57f2c]/20 bg-white/90"
      >
        <div
          class="mx-auto max-w-7xl px-4 py-5 text-center sm:px-6 lg:px-8"
        >
          <p
            class="text-xs font-semibold uppercase tracking-[0.14em] text-[#98989a]"
          >
            Gobierno de México · Seguridad · SESNSP
          </p>
        </div>
      </footer>
    </main>
  `,
})
export class HomeComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = signal<AuthenticatedUser | null>(
    null,
  );

  constructor() {
    this.loadCurrentUser();
  }

  displayName(): string {
    const currentUser = this.user();

    if (currentUser === null) {
      return '';
    }

    if (currentUser.person === null) {
      return currentUser.name;
    }

    return [
      currentUser.person.nombres,
      currentUser.person.apellido_paterno,
      currentUser.person.apellido_materno,
    ]
      .filter(
        (part): part is string =>
          typeof part === 'string' &&
          part.trim().length > 0,
      )
      .join(' ');
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        void this.router.navigateByUrl('/acceso');
      },
    });
  }

  private loadCurrentUser(): void {
    this.auth.currentUser().subscribe({
      next: (user) => {
        this.user.set(user);
      },
      error: () => {
        void this.router.navigateByUrl('/acceso');
      },
    });
  }
}
