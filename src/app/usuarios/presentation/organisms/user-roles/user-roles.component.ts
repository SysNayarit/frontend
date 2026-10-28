import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";

import { UserRole } from "../../../user-role.models";
import {
  UserRoleConfirmationComponent,
  type UserRoleOperation,
} from "../user-role-confirmation/user-role-confirmation.component";
import type {
  UserRoleReauthenticationForm,
} from "../../forms/user-role-reauthentication-form";
import { UserSummary } from "../../../user.models";
import { UserRoleSelectorComponent } from "../../molecules/user-role-selector/user-role-selector.component";

@Component({
  selector: "app-user-roles",
  standalone: true,
  imports: [UserRoleConfirmationComponent, UserRoleSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-label="Roles del usuario"
      class="overflow-hidden rounded-2xl border border-[#e7e2e3] bg-white p-5 shadow-sm sm:p-6"
    >
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#ece7e8] pb-5">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b6874]">
            Administración de autorizaciones
          </p>

          <h2 class="mt-1 text-xl font-semibold text-[#611232]">
            Roles asignados
          </h2>

          @if (user; as selected) {
            <p data-testid="selected-user" class="mt-2 break-words text-sm font-medium text-[#61575c]">
              {{ selected.name }} — {{ selected.email }}
            </p>
          }
        </div>

        @if (user) {
          <button
            type="button"
            data-testid="close-user-roles"
            class="siga-focus rounded-lg border border-[#e2d9dd] bg-white px-3 py-2 text-xs font-semibold text-[#611232] transition-colors hover:bg-[#f7f0f2]"
            (click)="close.emit()"
          >
            Cerrar detalle
          </button>
        }
      </div>

      @if (user && canManageRoles && !loading && !error) {
        <div class="mt-5">
          <button
            type="button"
            data-testid="assign-user-role"
            class="siga-focus rounded-lg bg-[#611232] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#7d1a41] disabled:opacity-50"
            [attr.aria-expanded]="roleSelectorOpen"
              aria-controls="inline-role-catalog"
              [disabled]="roleOperationProcessing"
              (click)="assignRequested.emit()"
          >
            {{ roleSelectorOpen ? "Ocultar roles disponibles" : "Asignar rol" }}
          </button>
          @if (roleSelectorOpen && user) {
            <div
              id="inline-role-catalog"
              data-testid="inline-role-catalog"
              class="mt-3 rounded-xl border border-[#a57f2c]/25 bg-[#fcfaf7] p-3 sm:p-4"
            >
              <app-user-role-selector
                [roles]="roleCatalog"
                [assignedRoles]="roles"
                [loading]="roleCatalogLoading"
                [error]="roleCatalogError"
                (roleSelected)="availableRoleSelected.emit($event)"
                (retry)="roleCatalogRetry.emit()"
                (cancel)="roleCatalogCancel.emit()"
              />
            </div>
          }
        </div>
      }

      @if (
        user &&
        selectedRoleOperation === "assign" &&
        selectedRoleForOperation &&
        roleReauthenticationForm
      ) {
        <div data-testid="inline-assign-role-confirmation" class="mt-3">
          <app-user-role-confirmation
            [user]="user"
            [role]="selectedRoleForOperation"
            operation="assign"
            [form]="roleReauthenticationForm"
            [processing]="roleOperationProcessing"
            [passwordError]="rolePasswordError"
            [operationError]="roleOperationError"
            (confirm)="confirmRoleOperation.emit()"
            (cancel)="cancelRoleOperation.emit()"
          />
        </div>
      }
      @if (!user) {
        <p
          data-testid="no-selected-user"
          class="mt-6 text-sm text-[#555555]"
        >
          Selecciona un usuario para consultar sus roles.
        </p>
      } @else if (loading) {
        <p role="status" data-testid="roles-loading" class="mt-6 text-sm">
          Consultando roles...
        </p>
      } @else if (error) {
        <div role="alert" data-testid="roles-error" class="mt-6">
          <p class="text-sm text-red-700">{{ error }}</p>
          <button
            type="button"
            class="siga-focus mt-3 rounded-lg border px-4 py-2 text-sm"
            (click)="retry.emit()"
          >
            Reintentar
          </button>
        </div>
      } @else if (roles.length === 0) {
        <p data-testid="roles-empty" class="mt-6 text-sm text-[#555555]">
          Este usuario no tiene roles asignados.
        </p>
      } @else {
        <ul data-testid="assigned-roles" class="mt-5 grid gap-3">
          @for (role of roles; track role.id) {
            <li class="rounded-xl border border-[#e9e2e5] bg-[#fcfbfb] p-4 transition-colors hover:border-[#bca2ac]">
              <p class="text-sm font-semibold text-[#352b30]">{{ role.name }}</p>
              <p class="mt-1 break-all text-xs tracking-wide text-[#82767c]">{{ role.code }}</p>
              @if (role.code === "ROL_ADMIN_SISTEMA") {
                <p class="mt-3 inline-flex items-center rounded-full border border-[#e8d7aa] bg-[#faf3dc] px-3 py-1 text-xs font-semibold text-[#76561a]">
                  Rol administrativo protegido
                </p>
              } @else if (canManageRoles) {
                <button
                  type="button"
                  data-testid="remove-user-role"
                  class="siga-focus mt-3 inline-flex items-center gap-2 rounded-lg border border-[#e5cbd3] bg-white px-3 py-2 text-xs font-semibold text-[#8b2948] transition-colors hover:bg-[#fff1f4] disabled:opacity-50"
                  [attr.aria-label]="'Retirar rol ' + role.name"
                  [attr.aria-expanded]="
                    selectedRoleOperation === 'remove' &&
                    selectedRoleForOperation?.id === role.id
                  "
                  [attr.aria-controls]="'role-action-' + role.id"
                  [disabled]="roleOperationProcessing"
                  (click)="removeRequested.emit(role)"
                >
                  {{
                    selectedRoleOperation === "remove" &&
                    selectedRoleForOperation?.id === role.id
                      ? "Ocultar acciones"
                      : "Retirar rol"
                  }}
                  <span aria-hidden="true">
                    {{
                      selectedRoleOperation === "remove" &&
                      selectedRoleForOperation?.id === role.id
                        ? "▴"
                        : "▾"
                    }}
                  </span>
                </button>

                @if (
                  selectedRoleOperation === "remove" &&
                  selectedRoleForOperation?.id === role.id &&
                  roleReauthenticationForm &&
                  user
                ) {
                  <div
                    data-testid="inline-remove-role-confirmation"
                    [id]="'role-action-' + role.id"
                    class="mt-4 rounded-xl border border-[#9b2247]/20 bg-[#fff8f9] p-2 sm:p-3"
                  >
                    <app-user-role-confirmation
                      [user]="user"
                      [role]="role"
                      operation="remove"
                      [form]="roleReauthenticationForm"
                      [processing]="roleOperationProcessing"
                      [passwordError]="rolePasswordError"
                      [operationError]="roleOperationError"
                      (confirm)="confirmRoleOperation.emit()"
                      (cancel)="cancelRoleOperation.emit()"
                    />
                  </div>
                }
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class UserRolesComponent {
  @Input() user: UserSummary | null = null;
  @Input() roles: readonly UserRole[] = [];
  @Input() canManageRoles = false;
  @Input() roleSelectorOpen = false;
  @Input() roleCatalog: readonly UserRole[] = [];
  @Input() roleCatalogLoading = false;
  @Input() roleCatalogError: string | null = null;
  @Input() selectedRoleOperation: UserRoleOperation = "assign";
  @Input() selectedRoleForOperation: UserRole | null = null;
  @Input() roleReauthenticationForm: UserRoleReauthenticationForm | null = null;
  @Input() roleOperationProcessing = false;
  @Input() rolePasswordError: string | null = null;
  @Input() roleOperationError: string | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly retry = new EventEmitter<void>();
  @Output() readonly assignRequested = new EventEmitter<void>();
  @Output() readonly availableRoleSelected = new EventEmitter<UserRole>();
  @Output() readonly roleCatalogRetry = new EventEmitter<void>();
  @Output() readonly roleCatalogCancel = new EventEmitter<void>();
  @Output() readonly removeRequested = new EventEmitter<UserRole>();
  @Output() readonly confirmRoleOperation = new EventEmitter<void>();
  @Output() readonly cancelRoleOperation = new EventEmitter<void>();
}