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

@Component({
  selector: "app-user-list",
  standalone: true,
  imports: [NgTemplateOutlet],
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
          <span class="ml-1 text-[#766b70]">
            en esta página
          </span>
        </div>
      </header>

      @if (users.length === 0) {
        <div
          data-testid="users-empty"
          class="px-6 py-14 text-center"
        >
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
        <div class="overflow-x-auto">
          <table class="w-full min-w-[820px] text-left text-sm">
            <thead
              class="border-b border-[#ece7e8] bg-[#faf8f8] text-xs uppercase tracking-wide text-[#766b70]"
            >
              <tr>
                <th scope="col" class="px-6 py-3 font-semibold">
                  Usuario
                </th>

                <th scope="col" class="px-5 py-3 font-semibold">
                  Persona vinculada
                </th>

                <th scope="col" class="px-5 py-3 font-semibold">
                  Fecha de registro
                </th>

                <th scope="col" class="px-6 py-3 text-right font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-[#f0ecee]">
              @for (user of users; track user.id) {
                <tr
                  data-testid="user-row"
                  class="transition-colors hover:bg-[#fcfafb]"
                >
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

                  <td class="px-6 py-4 text-right">
                    <button
                      type="button"
                      data-testid="view-user-roles"
                      class="siga-focus inline-flex items-center justify-center rounded-lg border border-[#611232]/25 bg-white px-4 py-2 text-xs font-semibold text-[#611232] transition-colors hover:border-[#611232] hover:bg-[#f7f0f2]"
                      [attr.aria-label]="'Administrar roles de ' + user.name"
                      (click)="userSelected.emit(user)"
                    >
                      {{ selectedUserId === user.id ? "Cerrar" : "Administrar" }}
                    </button>
                  </td>
                </tr>
              @if (selectedUserId === user.id && detailTemplate) {
                <tr data-testid="user-inline-detail">
                  <td colspan="4" class="px-4 pb-4 pt-0">
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

  @Input() selectedUserId: number | null = null;
  @Input() detailTemplate: TemplateRef<unknown> | null = null;

  @Output()
  readonly userSelected = new EventEmitter<UserSummary>();

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