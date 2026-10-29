import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";

import { AuthContextService } from "../../../../auth/auth-context.service";

@Component({
  selector: "app-users-module-navigation",
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      aria-label="Submenú de gestión de usuarios"
      class="rounded-xl border border-[#e7e2e3] bg-white p-2"
    >
      <div class="grid gap-2 sm:grid-cols-3">
        @if (canViewUsers()) {
          <a
            routerLink="/usuarios"
            routerLinkActive="!bg-[#611232] !text-white shadow-sm ring-2 ring-[#a57f2c]"
            [routerLinkActiveOptions]="{ exact: true }"
            #consultar="routerLinkActive"
            [attr.aria-current]="consultar.isActive ? 'page' : null"
            data-testid="users-nav-list"
            class="siga-focus rounded-lg border border-[#e7e2e3] px-4 py-3 text-center text-sm font-medium text-[#611232] transition-colors hover:bg-[#f7f0f2]"
            [class.!text-white]="consultar.isActive"
          >
            Consultar usuarios
          </a>
        }

        @if (canCreateUsers()) {
          <a
            routerLink="/usuarios/registro"
            routerLinkActive="!bg-[#611232] !text-white shadow-sm ring-2 ring-[#a57f2c]"
            [routerLinkActiveOptions]="{ exact: true }"
            #registro="routerLinkActive"
            [attr.aria-current]="registro.isActive ? 'page' : null"
            data-testid="users-nav-registration"
            class="siga-focus rounded-lg border border-[#e7e2e3] px-4 py-3 text-center text-sm font-medium text-[#611232] transition-colors hover:bg-[#f7f0f2]"
            [class.!text-white]="registro.isActive"
          >
            Registrar usuario
          </a>
        }

        @if (canAssignRoles()) {
          <a
            routerLink="/usuarios/roles/masivo"
            routerLinkActive="!bg-[#611232] !text-white shadow-sm ring-2 ring-[#a57f2c]"
            [routerLinkActiveOptions]="{ exact: true }"
            #masivo="routerLinkActive"
            [attr.aria-current]="masivo.isActive ? 'page' : null"
            data-testid="users-nav-bulk"
            class="siga-focus rounded-lg border border-[#e7e2e3] px-4 py-3 text-center text-sm font-medium text-[#611232] transition-colors hover:bg-[#f7f0f2]"
            [class.!text-white]="masivo.isActive"
          >
            Asignación masiva
          </a>
        }
      </div>
    </nav>
  `,
})
export class UsersModuleNavigationComponent {
  private readonly authContext = inject(AuthContextService);

  canViewUsers(): boolean {
    return this.authContext.hasPermission("usuarios.ver");
  }

  canCreateUsers(): boolean {
    return this.authContext.hasPermission("usuarios.crear");
  }

  canAssignRoles(): boolean {
    return (
      this.authContext.hasPermission("usuarios.asignar_roles") &&
      this.authContext.hasPermission("roles.ver")
    );
  }
}
