import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";

import { UserRole } from "../../../user-role.models";

@Component({
  selector: "app-user-role-selector",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-label="Selección de rol"
      class="rounded-xl border border-[#98989a]/30 bg-white p-5"
    >
      <h3 class="text-lg font-bold text-[#611232]">
        Seleccionar rol para asignar
      </h3>

      @if (loading) {
        <p role="status" class="mt-4 text-sm">
          Consultando catálogo de roles...
        </p>
      } @else if (error) {
        <div role="alert" class="mt-4">
          <p class="text-sm text-[#9b2247]">{{ error }}</p>
          <button
            type="button"
            data-testid="retry-role-catalog"
            class="siga-focus mt-3 rounded-lg border px-4 py-2 text-sm"
            (click)="retry.emit()"
          >
            Reintentar
          </button>
        </div>
      } @else if (availableRoles.length === 0) {
        <p
          data-testid="no-available-roles"
          class="mt-4 text-sm text-[#555555]"
        >
          No hay roles ordinarios disponibles para asignar.
        </p>
      } @else {
        <div class="mt-4 space-y-3">
          @for (role of availableRoles; track role.id) {
            <button
              type="button"
              data-testid="select-available-role"
              class="siga-focus flex w-full items-center justify-between rounded-lg border border-[#98989a]/30 p-4 text-left hover:bg-[#e6d194]/15"
              (click)="roleSelected.emit(role)"
            >
              <span>
                <span class="block font-semibold text-[#611232]">
                  {{ role.name }}
                </span>
                <span class="block text-xs text-[#555555]">
                  {{ role.code }}
                </span>
              </span>
              <span class="text-sm font-semibold text-[#611232]">
                Seleccionar
              </span>
            </button>
          }
        </div>
      }

      <button
        type="button"
        data-testid="cancel-role-selection"
        class="siga-focus mt-5 rounded-lg border border-[#98989a]/40 px-4 py-2 text-sm font-semibold text-[#611232]"
        (click)="cancel.emit()"
      >
        Cancelar
      </button>
    </section>
  `,
})
export class UserRoleSelectorComponent {
  @Input() roles: readonly UserRole[] = [];
  @Input() assignedRoles: readonly UserRole[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() readonly roleSelected = new EventEmitter<UserRole>();
  @Output() readonly retry = new EventEmitter<void>();
  @Output() readonly cancel = new EventEmitter<void>();

  get availableRoles(): readonly UserRole[] {
    const assignedIds = new Set(
      this.assignedRoles.map((role) => role.id),
    );

    return this.roles.filter(
      (role) =>
        role.code !== "ROL_ADMIN_SISTEMA" &&
        !assignedIds.has(role.id),
    );
  }
}