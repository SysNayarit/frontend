import { ChangeDetectionStrategy, Component, inject } from "@angular/core";

import { AuthContextService } from "./auth/auth-context.service";
import { authenticatedUserDisplayName } from "./auth/authenticated-user-display-name";

@Component({
  selector: "app-home",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <section
        class="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
      >
        <div
          class="h-1.5 bg-gradient-to-r from-[#611232] via-[#9b2247] to-[#a57f2c]"
          aria-hidden="true"
        ></div>

        <div class="p-6 sm:p-8">
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

              <p class="mt-4 max-w-2xl leading-7 text-[#555555]">
                Sesión institucional activa en la Plataforma Integral de Gestión
                Académica.
              </p>
            </div>

            <div
              class="inline-flex w-fit items-center gap-2 rounded-full border border-[#1e5b4f]/20 bg-[#1e5b4f]/10 px-4 py-2"
            >
              <span
                class="h-2.5 w-2.5 rounded-full bg-[#1e5b4f]"
                aria-hidden="true"
              ></span>

              <span class="text-sm font-semibold text-[#1e5b4f]">
                Sesión autenticada
              </span>
            </div>
          </div>

          @if (user()) {
            <div class="mt-8 grid gap-5 sm:grid-cols-2">
              <article
                class="rounded-2xl border border-[#98989a]/25 bg-[#f9f9f8] p-5"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.15em] text-[#98989a]"
                >
                  Usuario
                </p>

                <p
                  class="mt-2 break-words text-lg font-semibold text-[#161a1d]"
                >
                  {{ displayName }}
                </p>
              </article>

              <article
                class="rounded-2xl border border-[#98989a]/25 bg-[#f9f9f8] p-5"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.15em] text-[#98989a]"
                >
                  Correo institucional
                </p>

                <p class="mt-2 break-all text-lg font-semibold text-[#161a1d]">
                  {{ user()?.email }}
                </p>
              </article>
            </div>
          }
        </div>
      </section>

      <section
        class="rounded-2xl border border-[#e6d194]/60 bg-white p-6 shadow-sm sm:p-8"
      >
        <h3 class="siga-title text-xl font-bold text-[#611232]">
          Acceso institucional verificado
        </h3>

        <p class="mt-2 max-w-3xl text-sm leading-6 text-[#555555]">
          Las funciones disponibles se habilitan según los permisos efectivos
          validados por SIGA.
        </p>
        @if (user() && user()!.permissions.length === 0) {
          <p role="status" data-testid="no-functional-permissions" class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Tu cuenta no tiene permisos funcionales asignados. Contacta al administrador. Puedes cerrar tu sesión desde el encabezado.
          </p>
        }
      </section>
    </div>
  `,
})
export class HomeComponent {
  private readonly context = inject(AuthContextService);

  readonly user = this.context.user;

  constructor() {
    this.context.ensureCurrent().subscribe();
  }

  get displayName(): string {
    return authenticatedUserDisplayName(this.user());
  }
}
