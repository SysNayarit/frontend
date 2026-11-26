import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: "app-academic-organization-navigation",
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      aria-label="Submenú de Organización Académica"
      class="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5"
    >
      <div class="grid gap-2 sm:grid-cols-2">
        <a
          routerLink="/academico/organizacion"
          routerLinkActive="!bg-[#611232] !text-white shadow-sm ring-2 ring-[#a57f2c]"
          [routerLinkActiveOptions]="{ exact: true }"
          class="siga-focus rounded-xl border border-[#a57f2c]/25 px-4 py-3 text-center text-sm font-semibold text-[#611232] transition hover:bg-[#e6d194]/15"
          data-testid="academic-organization-submenu"
        >
          Organización Académica
        </a>

        <a
          routerLink="/academico/organizacion/horarios"
          routerLinkActive="!bg-[#611232] !text-white shadow-sm ring-2 ring-[#a57f2c]"
          [routerLinkActiveOptions]="{ exact: true }"
          class="siga-focus rounded-xl border border-[#a57f2c]/25 px-4 py-3 text-center text-sm font-semibold text-[#611232] transition hover:bg-[#e6d194]/15"
          data-testid="academic-schedules-submenu"
        >
          Horarios de Clases
        </a>
      </div>
    </nav>
  `,
})
export class AcademicOrganizationNavigationComponent {}