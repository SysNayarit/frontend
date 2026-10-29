import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: "app-main-navigation",
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      aria-label="Navegación principal"
      class="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
    >
      <div class="border-b border-[#a57f2c]/20 px-5 py-5">
        <p
          class="text-xs font-semibold uppercase tracking-[0.18em] text-[#98989a]"
        >
          Navegación
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
            ●
          </span>

          Inicio
        </a>

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
          Los módulos se habilitarán conforme sean incorporados a la Plataforma
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
