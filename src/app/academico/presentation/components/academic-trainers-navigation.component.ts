import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { AuthContextService } from "../../../auth/auth-context.service";

@Component({
  selector: "app-academic-trainers-navigation",
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      aria-label="Submenú de gestión de formadores"
      class="rounded-xl border border-[#e7e2e3] bg-white p-2"
    >
      <div class="grid gap-2 sm:grid-cols-3">
        <a
          routerLink="/academico/formadores"
          routerLinkActive="!bg-[#611232] !text-white shadow-sm ring-2 ring-[#a57f2c]"
          [routerLinkActiveOptions]="{ exact: true }"
          #personal="routerLinkActive"
          [attr.aria-current]="personal.isActive ? 'page' : null"
          data-testid="formadores-nav-personal"
          class="siga-focus rounded-lg border border-[#e7e2e3] px-4 py-3 text-center text-sm font-medium text-[#611232] transition-colors hover:bg-[#f7f0f2]"
        >
          Personal formador
        </a>

        @if (canRegister()) {
          <a
            routerLink="/academico/importaciones/formadores"
            routerLinkActive="!bg-[#611232] !text-white shadow-sm ring-2 ring-[#a57f2c]"
            [routerLinkActiveOptions]="{ exact: true }"
            #excel="routerLinkActive"
            [attr.aria-current]="excel.isActive ? 'page' : null"
            data-testid="formadores-nav-excel"
            class="siga-focus rounded-lg border border-[#e7e2e3] px-4 py-3 text-center text-sm font-medium text-[#611232] transition-colors hover:bg-[#f7f0f2]"
          >
            Validar formadores Excel
          </a>
        }

        <a
          routerLink="/academico/formadores/consulta"
          routerLinkActive="!bg-[#611232] !text-white shadow-sm ring-2 ring-[#a57f2c]"
          [routerLinkActiveOptions]="{ exact: true }"
          #consulta="routerLinkActive"
          [attr.aria-current]="consulta.isActive ? 'page' : null"
          data-testid="formadores-nav-consulta"
          class="siga-focus rounded-lg border border-[#e7e2e3] px-4 py-3 text-center text-sm font-medium text-[#611232] transition-colors hover:bg-[#f7f0f2]"
        >
          Búsquedas e indicadores
        </a>
      </div>
    </nav>
  `,
})
export class AcademicTrainersNavigationComponent {
  private readonly context = inject(AuthContextService);

  canRegister(): boolean {
    return this.context.hasPermission("academico.formadores.registrar");
  }
}