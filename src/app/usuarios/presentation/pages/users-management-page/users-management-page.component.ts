import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-users-management-page",
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="space-y-6">
      <header class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <p
          class="text-xs font-semibold uppercase tracking-widest text-[#9b2247]"
        >
          Administración
        </p>

        <h1 class="mt-2 text-3xl font-bold text-[#611232]">
          Gestión de usuarios
        </h1>

        <p class="mt-3 text-sm leading-6 text-gray-600">
          Selecciona la operación que deseas realizar. Cada sección tendrá su
          propia página.
        </p>
      </header>

      <nav
        aria-label="Submenú de Gestión de usuarios"
        class="grid gap-4 md:grid-cols-3"
      >
        <section
          data-testid="menu-user-registration"
          class="rounded-xl border border-[#e7e2e3] bg-white p-5"
        >
          <h2 class="text-lg font-semibold text-[#611232]">
            Registro de usuarios
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Crear cuentas vinculadas a Personas registradas que todavía no
            tengan usuario asociado.
          </p>
          <a
            routerLink="/usuarios/registro"
            data-testid="menu-open-user-registration"
            class="siga-focus mt-4 inline-flex rounded-lg bg-[#611232] px-4 py-2 text-sm font-medium text-white"
          >
            Abrir registro de usuarios
          </a>
        </section>

        <section
          data-testid="menu-bulk-roles"
          class="rounded-xl border border-[#e7e2e3] bg-white p-5"
        >
          <h2 class="text-lg font-semibold text-[#611232]">
            Asignación masiva de roles
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Seleccionar un rol aplicable y asignarlo a varios usuarios
            existentes.
          </p>
          <p class="mt-4 text-xs font-medium text-gray-500">
            Página independiente en preparación
          </p>
        </section>

        <section
          data-testid="menu-registered-users"
          class="rounded-xl border border-[#e7e2e3] bg-white p-5"
        >
          <h2 class="text-lg font-semibold text-[#611232]">
            Usuarios registrados
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Consultar cuentas, buscar, filtrar y administrar roles
            individualmente.
          </p>

          <a
            routerLink="/usuarios"
            data-testid="menu-open-current-users"
            class="siga-focus mt-4 inline-flex rounded-lg bg-[#611232] px-4 py-2 text-sm font-medium text-white"
          >
            Abrir gestión actual
          </a>
        </section>
      </nav>

      <p class="text-xs text-gray-500">
        Esta es la primera etapa de la reorganización. Las operaciones
        existentes permanecen disponibles en la pantalla actual hasta completar
        su separación.
      </p>
    </main>
  `,
})
export class UsersManagementPageComponent {}
