import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";

import { NgTemplateOutlet } from "@angular/common";
import { TemplateRef } from "@angular/core";
import { UserSummary } from "../../../user.models";
import { UserAccessStatusBadgeComponent } from "../../atoms/user-access-status-badge/user-access-status-badge.component";

@Component({
  selector: "app-user-list",
  standalone: true,
  imports: [NgTemplateOutlet, UserAccessStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-label="Usuarios registrados"
      class="overflow-hidden rounded-2xl border border-[#e7e2e3] bg-white shadow-sm"
    >
      <header
        class="flex flex-wrap items-center justify-between gap-4 border-b border-[#ece7e8] px-5 py-5 sm:px-6"
      >
        <div>
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b6874]"
          >
            Directorio institucional
          </p>

          <h2 class="mt-1 text-lg font-semibold text-[#611232]">
            Usuarios registrados
          </h2>

          <p class="mt-1 text-sm text-[#696469]">
            Consulta las cuentas y administra sus roles.
          </p>
        </div>

        <div
          class="rounded-lg border border-[#e8e0e2] bg-[#faf8f8] px-3 py-2 text-sm text-[#611232]"
          aria-label="Usuarios visibles en esta página"
        >
          <span class="font-semibold">{{ users.length }}</span>
          <span class="ml-1 text-[#766b70]"> en esta página </span>
        </div>
      </header>

      <div class="border-b border-[#ece7e8] px-5 py-4 sm:px-6">
        <label
          for="users-global-search"
          class="block text-sm font-medium text-[#611232]"
        >
          Buscar usuarios registrados
        </label>
        <div class="mt-2 flex flex-wrap items-center gap-3">
          <input
            id="users-global-search"
            data-testid="users-global-search"
            type="search"
            autocomplete="off"
            placeholder="Usuario, correo o nombre de Persona"
            class="siga-focus min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            [value]="globalSearch"
            (input)="globalSearch = $any($event.target).value"
          />
          <button
            type="button"
            data-testid="users-clear-filters"
            class="siga-focus rounded-lg border border-[#611232]/25 px-3 py-2 text-sm font-medium text-[#611232]"
            (click)="clearFilters()"
          >
            Limpiar filtros
          </button>
        </div>
        <p data-testid="users-filter-count" class="mt-2 text-xs text-gray-600">
          {{ filteredUsers().length }} de {{ users.length }}
          usuarios visibles en esta página.
        </p>
        <p class="mt-1 text-xs text-gray-500">
          La búsqueda y los filtros se aplican solamente a esta página.
        </p>
      </div>

      @if (users.length === 0) {
        <div data-testid="users-empty" class="px-6 py-14 text-center">
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4edef] text-xl font-semibold text-[#611232]"
            aria-hidden="true"
          >
            U
          </div>

          <h3 class="mt-4 font-semibold text-[#611232]">
            No se encontraron usuarios
          </h3>

          <p class="mt-2 text-sm text-[#696469]">
            No hay usuarios para mostrar.
          </p>
        </div>
      } @else {
        @if (filteredUsers().length === 0) {
          <p
            data-testid="users-filter-empty"
            role="status"
            class="px-6 py-4 text-sm text-gray-600"
          >
            No hay coincidencias con los filtros aplicados en esta página.
            Puedes limpiar los filtros.
          </p>
        }
        <div class="overflow-x-auto">
          <table class="w-full min-w-[820px] text-left text-sm">
            <thead
              class="border-b border-[#ece7e8] bg-[#faf8f8] text-xs uppercase tracking-wide text-[#766b70]"
            >
              <tr>
                @if (bulkSelectionEnabled) {
                  <th scope="col" class="px-3 py-3 font-semibold">
                    Seleccionar
                  </th>
                }

                <th scope="col" class="px-6 py-3 font-semibold">
                  <label for="users-column-name">Usuario</label>
                  <input
                    id="users-column-name"
                    data-testid="users-column-name"
                    type="search"
                    placeholder="Nombre o correo"
                    class="siga-focus mt-2 block w-full min-w-[150px] rounded border border-gray-300 bg-white px-2 py-1.5 text-xs font-normal normal-case tracking-normal"
                    [value]="userColumnSearch"
                    (input)="userColumnSearch = $any($event.target).value"
                  />
                </th>

                <th scope="col" class="px-5 py-3 font-semibold">
                  <label for="users-column-person">Persona vinculada</label>
                  <select
                    id="users-column-person"
                    data-testid="users-column-person"
                    class="siga-focus mt-2 block w-full min-w-[150px] rounded border border-gray-300 bg-white px-2 py-1.5 text-xs font-normal normal-case tracking-normal"
                    [value]="personFilter"
                    (change)="personFilter = $any($event.target).value"
                  >
                    <option value="all">Todas</option>
                    <option value="linked">Vinculadas</option>
                    <option value="unlinked">Sin vincular</option>
                  </select>
                </th>

                <th scope="col" class="px-5 py-3 font-semibold">
                  <label for="users-column-date">Fecha de registro</label>
                  <input
                    id="users-column-date"
                    data-testid="users-column-date"
                    type="date"
                    class="siga-focus mt-2 block w-full min-w-[145px] rounded border border-gray-300 bg-white px-2 py-1.5 text-xs font-normal normal-case tracking-normal"
                    [value]="registrationFilter"
                    (change)="registrationFilter = $any($event.target).value"
                  />
                </th>

                <th scope="col" class="px-5 py-3 font-semibold">Estado de cuenta</th>
                @if (!bulkSelectionEnabled) {
                  <th scope="col" class="px-6 py-3 text-right font-semibold">
                    Acciones
                  </th>
                }
              </tr>
            </thead>

            <tbody class="divide-y divide-[#f0ecee]">
              @for (user of filteredUsers(); track user.id) {
                <tr
                  data-testid="user-row"
                  class="transition-colors hover:bg-[#fcfafb]"
                >
                  @if (bulkSelectionEnabled) {
                    <td
                      class="px-3 py-4 transition-shadow duration-300"
                      [style.box-shadow]="
                        highlightedUserIds.includes(user.id)
                          ? 'inset 3px 0 0 #a57f2c'
                          : null
                      "
                    >
                      <input
                        type="checkbox"
                        data-testid="bulk-user-checkbox"
                        class="siga-focus h-4 w-4 accent-[#611232]"
                        [checked]="selectedUserIds.includes(user.id)"
                        [disabled]="
                          user.person === null || bulkSelectionDisabled
                        "
                        [attr.aria-label]="'Seleccionar a ' + user.name"
                        (change)="
                          selectionChanged.emit({
                            user,
                            selected: $any($event.target).checked,
                          })
                        "
                      />
                    </td>
                  }

                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1e6ea] font-bold text-[#611232]"
                        aria-hidden="true"
                      >
                        {{ user.name.trim().charAt(0).toUpperCase() || "U" }}
                      </div>

                      <div class="min-w-0">
                        <p class="font-semibold text-[#292327]">
                          {{ user.name }}
                        </p>

                        <p class="mt-1 break-all text-xs text-[#746e73]">
                          {{ user.email }}
                        </p>

                        @if (bulkSelectionEnabled) {
                          <div
                            class="mt-2 flex flex-wrap gap-1"
                            [attr.aria-label]="'Roles asignados a ' + user.name"
                          >
                            @for (role of user.roles ?? []; track role.id) {
                              <span
                                class="inline-flex max-w-full rounded-md border border-[#e7e2e3] bg-[#faf8f8] px-2 py-0.5 text-[11px] font-medium text-[#615b5f]"
                                [title]="role.name"
                              >
                                {{ role.code }}
                              </span>
                            } @empty {
                              <span class="text-xs text-[#766b70]">
                                Sin roles asignados
                              </span>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  </td>

                  <td class="px-5 py-4">
                    @if (user.person; as person) {
                      <div class="space-y-1">
                        <span
                          class="inline-flex rounded-full bg-[#edf6f0] px-2.5 py-1 text-xs font-medium text-[#276744]"
                        >
                          Vinculada
                        </span>

                        <p class="text-sm text-[#4b4448]">
                          {{ person.nombres }}
                          {{ person.apellido_paterno }}
                          {{ person.apellido_materno }}
                        </p>
                      </div>
                    } @else {
                      <span
                        class="inline-flex rounded-full bg-[#f4f1f2] px-2.5 py-1 text-xs font-medium text-[#756c71]"
                      >
                        Sin persona vinculada
                      </span>
                    }
                  </td>

                  <td class="px-5 py-4 text-[#615b5f]">
                    {{ registrationDate(user.created_at) }}
                  </td>

                  <td class="px-5 py-4"><app-user-access-status-badge [status]="user.access_status" /></td>
                  @if (!bulkSelectionEnabled) {
                    <td class="px-6 py-4 text-right">
                      <button
                        type="button"
                        data-testid="view-user-roles"
                        class="siga-focus inline-flex items-center justify-center rounded-lg border border-[#611232]/25 bg-white px-4 py-2 text-xs font-semibold text-[#611232] transition-colors hover:border-[#611232] hover:bg-[#f7f0f2]"
                        [attr.aria-label]="'Administrar roles de ' + user.name"
                        (click)="userSelected.emit(user)"
                      >
                        {{
                          selectedUserId === user.id ? "Cerrar" : "Administrar"
                        }}
                      </button>
                    </td>
                  }
                </tr>
                @if (selectedUserId === user.id && detailTemplate) {
                  <tr data-testid="user-inline-detail">
                    <td [attr.colspan]="5" class="px-4 pb-4 pt-0">
                      <ng-container [ngTemplateOutlet]="detailTemplate" />
                    </td>
                  </tr>
                }
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

  @Input() bulkSelectionEnabled = false;
  @Input() bulkSelectionDisabled = false;
  @Input() selectedUserIds: readonly number[] = [];
  @Input() highlightedUserIds: readonly number[] = [];

  @Output()
  readonly selectionChanged = new EventEmitter<{
    user: UserSummary;
    selected: boolean;
  }>();

  @Input() selectedUserId: number | null = null;
  @Input() detailTemplate: TemplateRef<unknown> | null = null;

  @Output()
  readonly userSelected = new EventEmitter<UserSummary>();

  globalSearch = "";
  userColumnSearch = "";
  personFilter = "all";
  registrationFilter = "";

  clearFilters(): void {
    this.globalSearch = "";
    this.userColumnSearch = "";
    this.personFilter = "all";
    this.registrationFilter = "";
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es-MX")
      .trim();
  }

  filteredUsers(): readonly UserSummary[] {
    const global = this.normalizeSearch(this.globalSearch);
    const userQuery = this.normalizeSearch(this.userColumnSearch);

    return this.users.filter((user) => {
      const personName = user.person
        ? [
            user.person.nombres,
            user.person.apellido_paterno,
            user.person.apellido_materno,
          ]
            .filter(Boolean)
            .join(" ")
        : "";

      const userText = this.normalizeSearch(`${user.name} ${user.email}`);

      const fullText = this.normalizeSearch(
        `${user.name} ${user.email} ${personName}`,
      );

      if (global && !fullText.includes(global)) return false;
      if (userQuery && !userText.includes(userQuery)) return false;

      if (this.personFilter === "linked" && user.person === null) {
        return false;
      }

      if (this.personFilter === "unlinked" && user.person !== null) {
        return false;
      }

      if (
        this.registrationFilter &&
        this.registrationDate(user.created_at) !== this.registrationFilter
      ) {
        return false;
      }

      return true;
    });
  }

  private readonly dateFormatter = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  registrationDate(createdAt: string): string {
    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "Fecha no disponible";
    }

    const parts = this.dateFormatter.formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    return `${year}-${month}-${day}`;
  }
}
