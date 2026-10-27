import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core";

import { UserSummary } from "../../../user.models";

@Component({
  selector: "app-user-list",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-label="Usuarios registrados"
      class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
    >
      <div class="border-b border-[#98989a]/20 px-6 py-5">
        <h3 class="text-lg font-bold text-[#611232]">
          Usuarios registrados
        </h3>

        <p class="mt-1 text-sm text-[#555555]">
          Cuentas de acceso registradas en SIGA.
        </p>
      </div>

      @if (users.length === 0) {
        <p
          data-testid="users-empty"
          class="px-6 py-10 text-center text-sm text-[#555555]"
        >
          No hay usuarios para mostrar.
        </p>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#f9f9f8] text-[#611232]">
              <tr>
                <th scope="col" class="px-5 py-4 font-semibold">
                  Usuario
                </th>
                <th scope="col" class="px-5 py-4 font-semibold">
                  Correo electrónico
                </th>
                <th scope="col" class="px-5 py-4 font-semibold">
                  Persona vinculada
                </th>
                <th scope="col" class="px-5 py-4 font-semibold">
                  Registro
                </th>
                <th scope="col" class="px-5 py-4 font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-[#98989a]/20">
              @for (user of users; track user.id) {
                <tr data-testid="user-row">
                  <td class="px-5 py-4 font-medium text-[#161a1d]">
                    {{ user.name }}
                  </td>

                  <td class="px-5 py-4 text-[#555555]">
                    {{ user.email }}
                  </td>

                  <td class="px-5 py-4 text-[#555555]">
                    @if (user.person; as person) {
                      {{ person.nombres }}
                      {{ person.apellido_paterno }}
                      {{ person.apellido_materno }}
                    } @else {
                      Sin persona vinculada
                    }
                  </td>

                  <td class="px-5 py-4 text-[#555555]">
                    {{ user.created_at.slice(0, 10) }}
                  </td>
                  <td class="px-5 py-4">
                    <button
                      type="button"
                      data-testid="view-user-roles"
                      class="siga-focus rounded-lg border border-[#611232]/25 px-3 py-2 text-sm font-semibold text-[#611232] hover:bg-[#e6d194]/15"
                      [attr.aria-label]="'Ver roles de ' + user.name"
                      (click)="userSelected.emit(user)"
                    >
                      Ver roles
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class UserListComponent {
  @Input()
  users: readonly UserSummary[] = [];

  @Output() readonly userSelected = new EventEmitter<UserSummary>();
}