import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: "app-main-navigation",
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      aria-label="Navegaci├│n principal"
      class="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
    >
      <div class="border-b border-[#a57f2c]/20 px-5 py-5">
        <p
          class="text-xs font-semibold uppercase tracking-[0.18em] text-[#98989a]"
        >
          Navegaci├│n
        </p>
      </div>

      <div class="space-y-2 p-3">
        <a
          routerLink="/inicio"
          routerLinkActive="bg-[#611232] text-white shadow-sm"
          [routerLinkActiveOptions]="{
            exact: true,
          }"
          data-testid="home-navigation"
          class="siga-focus flex items-center gap-3 rounded-xl border border-[#98989a]/20 px-4 py-3 font-semibold text-[#611232] transition hover:border-[#a57f2c]/40 hover:bg-[#e6d194]/15"
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6d194]/35"
            aria-hidden="true"
          >
            ÔùÅ
          </span>

          Inicio
        </a>


        @if (hasPermission("credenciales.emitir") && hasPermission("personas.ver")) {
          <a
            routerLink="/credenciales/institucionales/emitir"
            routerLinkActive="bg-[#611232] text-white"
            class="siga-focus flex items-center gap-3 rounded-xl border px-4 py-3 font-semibold text-[#611232]"
          >
            Emitir credencial institucional
          </a>
          <a routerLink="/credenciales/qr/generar" routerLinkActive="bg-[#611232] text-white" class="siga-focus flex items-center gap-3 rounded-xl border px-4 py-3 font-semibold text-[#611232]">Generar QR</a>
        }
        @if (hasPermission("credenciales.validar")) {
          <a
            routerLink="/credenciales/qr/validar"
            routerLinkActive="bg-[#611232] text-white shadow-sm"
            data-testid="credential-qr-navigation"
            class="siga-focus flex items-center gap-3 rounded-xl border border-[#98989a]/20 px-4 py-3 font-semibold text-[#611232] transition hover:bg-[#e6d194]/15"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6d194]/35"
              aria-hidden="true"
            >QR</span>
            <span>Validar credencial</span>
          </a>
        }
        @if (hasPermission("eventos.ver")) {
          <div class="space-y-1" data-testid="event-management-navigation">
            <p class="px-4 pt-2 text-xs font-bold uppercase tracking-widest text-gray-500">
              Eventos
            </p>
            <a
              routerLink="/eventos/gestion"
              routerLinkActive="bg-[#611232] text-white shadow-sm"
              class="siga-focus flex items-center gap-3 rounded-xl border border-[#98989a]/20 px-4 py-3 font-semibold text-[#611232] transition hover:bg-[#e6d194]/15"
            >
              <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6d194]/35"
                    aria-hidden="true">E</span>
              Gesti├│n de Eventos
            </a>
          </div>
        }
        @if (hasPermission("academico.organizacion.ver")) {
          <a
            routerLink="/academico/organizacion"
            routerLinkActive="bg-[#611232] text-white shadow-sm"
            data-testid="academic-organization-navigation"
            class="siga-focus flex items-center gap-3 rounded-xl border border-[#98989a]/20 px-4 py-3 font-semibold text-[#611232] transition hover:bg-[#e6d194]/15"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6d194]/35"
              aria-hidden="true"
            >
              A
            </span>
            Organizaci├│n Acad├®mica
          </a>
        }
        @if (hasPermission("academico.horarios.ver")) {
          <!-- SIGA_MENU_HORARIOS_A11_I03 -->
          <a
            routerLink="/academico/organizacion/horarios"
            routerLinkActive="bg-[#611232] text-white"
            data-testid="horarios-academicos-menu"
            class="siga-focus flex items-center gap-3 rounded-xl border border-[#e7e2e3] px-4 py-3 text-sm font-semibold text-[#611232] transition-colors hover:bg-[#f7f0f2]"
          >
            <span
              aria-hidden="true"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f6efd9] font-bold text-[#611232]"
            >
              H
            </span>
            <span>Horarios Acad├®micos</span>
          </a>
        }

        @if (hasPermission("academico.formadores.ver")) {
          <a
            routerLink="/academico/formadores"
            routerLinkActive="bg-[#611232] text-white shadow-sm"
            [routerLinkActiveOptions]="{ exact: false }"
            data-testid="formadores-menu"
            class="siga-focus flex items-center gap-3 rounded-xl border border-[#98989a]/20 px-4 py-3 font-semibold text-[#611232] transition hover:border-[#a57f2c]/40 hover:bg-[#e6d194]/15"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6d194]/35"
              aria-hidden="true"
            >
              F
            </span>
            Formadores
          </a>
        }
        @if (
          hasPermission("academico.organizacion.ver") &&
          hasPermission("academico.organizacion.registrar")
        ) {
          <a
            routerLink="/academico/importaciones/materias"
            routerLinkActive="bg-[#611232] text-white shadow-sm"
            data-testid="academic-bulk-catalog-navigation-materias"
            class="siga-focus flex items-center gap-3 rounded-xl border border-[#98989a]/20 px-4 py-3 font-semibold text-[#611232] transition hover:bg-[#e6d194]/15"
          >
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6d194]/35" aria-hidden="true">M</span>
            Validar materias Excel
          </a>
        }


        @if (
          hasPermission("academico.organizacion.ver") &&
          hasPermission("academico.formadores.ver")
        ) {
          <a
            routerLink="/academico/evaluacion-docente/preparacion"
            routerLinkActive="bg-[#611232] text-white shadow-sm"
            data-testid="teacher-evaluation-readiness-navigation"
            class="siga-focus flex items-center gap-3 rounded-xl border border-[#98989a]/20 px-4 py-3 font-semibold text-[#611232] transition hover:bg-[#e6d194]/15"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6d194]/35"
              aria-hidden="true"
            >
              E
            </span>
            Preparaci├│n de Evaluaci├│n Docente
          </a>
        }
        @if (hasPermission("usuarios.ver")) {
          <a
            routerLink="/usuarios"
            routerLinkActive="bg-[#611232] text-white shadow-sm"
            [routerLinkActiveOptions]="{ exact: false }"
            data-testid="users-navigation"
            class="siga-focus flex items-center gap-3 rounded-xl border border-[#98989a]/20 px-4 py-3 font-semibold text-[#611232] transition hover:border-[#a57f2c]/40 hover:bg-[#e6d194]/15"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6d194]/35"
              aria-hidden="true"
            >
              U
            </span>

            Usuarios
          </a>
        }
        @if (hasPermission("personas.ver")) {
          <a
            routerLink="/personas"
            routerLinkActive="bg-[#611232] text-white shadow-sm"
            [routerLinkActiveOptions]="{
              exact: true,
            }"
            data-testid="personas-navigation"
            class="siga-focus flex items-center gap-3 rounded-xl border border-[#98989a]/20 px-4 py-3 font-semibold text-[#611232] transition hover:border-[#a57f2c]/40 hover:bg-[#e6d194]/15"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6d194]/35"
              aria-hidden="true"
            >
              P
            </span>

            Personas
          </a>
        }
      </div>

      <div class="border-t border-[#98989a]/20 px-5 py-5">
        <p class="text-xs leading-5 text-[#6b6b6b]">
          Los m├│dulos se habilitar├ín conforme sean incorporados a la Plataforma
          Integral.
        </p>
      </div>
    </nav>
  `,
})
export class MainNavigationComponent {
  @Input()
  permissions: readonly string[] = [];

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }
}
