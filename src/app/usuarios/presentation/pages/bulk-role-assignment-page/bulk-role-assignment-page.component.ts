import { ReactiveFormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { switchMap, timer } from "rxjs";
import { AuthService } from "../../../../auth/auth.service";
import { createUserRoleReauthenticationForm } from "../../forms/user-role-reauthentication-form";
import { UsersModuleNavigationComponent } from "../../molecules/users-module-navigation/users-module-navigation.component";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  signal,
  inject,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { UserRole } from "../../../user-role.models";
import { UserSummary } from "../../../user.models";
import { UserService } from "../../../user.service";
import { BulkRoleSelectionStore } from "../../../application/bulk-roles/bulk-role-selection.store";
import { UserListComponent } from "../../organisms/user-list/user-list.component";
import { UserRoleService } from "../../../user-role.service";

import { AuthContextService } from "../../../../auth/auth-context.service";

@Component({
  selector: "app-bulk-role-assignment-page",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UsersModuleNavigationComponent,
    RouterLink,
    UserListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="space-y-5">
      <app-users-module-navigation />
      <nav aria-label="Navegación de usuarios">
        <a
          routerLink="/usuarios/menu"
          class="siga-focus text-sm font-medium text-[#611232] underline"
        >
          Gestión de usuarios
        </a>
        <span class="mx-2 text-gray-400">&gt;</span>
        <span class="text-sm text-gray-600"> Asignación masiva de roles </span>
      </nav>

      <header class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 class="text-2xl font-bold text-[#611232]">
          Asignación masiva de roles
        </h1>
        <p class="mt-2 text-sm text-gray-600">
          Selecciona un rol aplicable y asígnalo a varios usuarios registrados,
          previa confirmación administrativa.
        </p>
      </header>

      <section
        data-testid="bulk-page-operation-selector"
        class="rounded-xl border border-[#e7e2e3] bg-white p-5"
      >
        <h2 class="text-base font-semibold text-[#611232]">
          Operación de roles
        </h2>
        <p class="mt-1 text-sm text-gray-600">
          Selecciona si deseas asignar o retirar un rol a varios usuarios.
        </p>
        <div class="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            data-testid="bulk-page-mode-assign"
            [attr.aria-pressed]="operationMode() === 'assign'"
            [disabled]="bulkProcessing() || !canAssignRoles()"
            (click)="setOperationMode('assign')"
            class="siga-focus rounded-lg border px-4 py-2 text-sm font-medium"
            [class.border-[#611232]]="operationMode() === 'assign'"
            [class.bg-[#f7f0f2]]="operationMode() === 'assign'"
          >
            Asignar rol
          </button>
          <button
            type="button"
            data-testid="bulk-page-mode-remove"
            [attr.aria-pressed]="operationMode() === 'remove'"
            [disabled]="bulkProcessing() || !canRemoveRoles()"
            (click)="setOperationMode('remove')"
            class="siga-focus rounded-lg border px-4 py-2 text-sm font-medium"
            [class.border-[#611232]]="operationMode() === 'remove'"
            [class.bg-[#f7f0f2]]="operationMode() === 'remove'"
          >
            Retirar rol
          </button>
        </div>
      </section>

      @if (!canManageRoles()) {
        <p
          role="alert"
          data-testid="bulk-page-no-permission"
          class="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700"
        >
          No tienes los permisos necesarios para asignar roles masivamente.
        </p>
      } @else {
        @if (operationMode() === "remove") {
          <section
            data-testid="bulk-page-removal-pending"
            class="rounded-xl border border-[#e7e2e3] bg-white p-5"
          >
            <h2 class="text-base font-semibold text-[#611232]">
              Retirada masiva de roles
            </h2>
            <p class="mt-2 text-sm text-gray-600">
              El servicio de retirada ya está validado. La confirmación
              administrativa y el reporte de esta operación se integrarán antes
              de habilitar su ejecución.
            </p>
          </section>
        } @else {
          <section
            data-testid="bulk-role-section"
            class="rounded-xl border border-[#e7e2e3] bg-white p-5"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-[#611232]">
                  1. Seleccionar rol
                </h2>
                <p class="mt-1 text-xs text-gray-600">
                  Selecciona el rol que se asignará posteriormente a los
                  usuarios registrados.
                </p>
              </div>

              <button
                type="button"
                data-testid="bulk-page-refresh-roles"
                [disabled]="rolesLoading() || bulkProcessing()"
                (click)="loadRoles()"
                class="siga-focus rounded-lg border border-[#611232]/25 px-3 py-2 text-sm text-[#611232] disabled:opacity-50"
              >
                Actualizar roles
              </button>
            </div>

            @if (rolesLoading()) {
              <p role="status" class="mt-4 text-sm text-gray-600">
                Consultando roles...
              </p>
            }

            @if (rolesError()) {
              <p role="alert" class="mt-4 text-sm text-red-700">
                {{ rolesError() }}
              </p>
            }

            @if (!rolesLoading() && !rolesError()) {
              <div
                data-testid="bulk-page-role-catalog"
                class="mt-4 grid gap-2 sm:grid-cols-2"
              >
                @for (role of availableRoles(); track role.id) {
                  <button
                    type="button"
                    data-testid="bulk-page-select-role"
                    [attr.aria-pressed]="selectedRole()?.id === role.id"
                    [disabled]="bulkProcessing()"
                    (click)="selectRole(role)"
                    class="siga-focus rounded-lg border border-[#e7e2e3] bg-white p-3 text-left text-sm text-[#611232]"
                    [class.border-[#611232]]="selectedRole()?.id === role.id"
                    [class.bg-[#f7f0f2]]="selectedRole()?.id === role.id"
                  >
                    {{ role.code }} · {{ role.name }}
                    @if (selectedRole()?.id === role.id) {
                      <span class="ml-2 font-semibold">— Seleccionado</span>
                    }
                  </button>
                } @empty {
                  <p class="text-sm text-gray-600">
                    No hay roles disponibles para esta operación.
                  </p>
                }
              </div>
            }

            <p class="mt-4 text-xs text-gray-600">
              Los roles administrativos protegidos no están disponibles para
              esta operación.
            </p>
          </section>

          <section data-testid="bulk-page-user-selection" class="space-y-4">
            <div class="rounded-xl border border-[#e7e2e3] bg-white p-4">
              <h2 class="text-base font-semibold text-[#611232]">
                2. Seleccionar usuarios registrados
              </h2>
              <p class="mt-1 text-xs text-gray-600">
                Selecciona hasta 100 usuarios vinculados a Personas. La
                selección se conserva al cambiar de página.
              </p>

              <p
                data-testid="bulk-page-selection-count"
                class="mt-3 text-sm font-medium text-[#611232]"
              >
                {{ selectedUserIds().length }} de 100 usuarios seleccionados.
              </p>
            </div>

            @if (usersLoading()) {
              <p role="status" class="rounded-lg bg-white p-4 text-sm">
                Consultando usuarios...
              </p>
            }

            @if (usersError()) {
              <div
                role="alert"
                class="rounded-lg border border-red-200 bg-white p-4"
              >
                <p class="text-sm text-red-700">{{ usersError() }}</p>
                <button
                  type="button"
                  data-testid="bulk-page-retry-users"
                  (click)="loadUsers(currentPage())"
                  class="siga-focus mt-3 text-sm font-medium text-[#611232] underline"
                >
                  Reintentar
                </button>
              </div>
            }

            @if (!usersLoading() && !usersError()) {
              <app-user-list
                [users]="users()"
                [bulkSelectionEnabled]="true"
                [selectedUserIds]="selectedUserIds()"
                [highlightedUserIds]="highlightedUserIds()"
                [bulkSelectionDisabled]="bulkProcessing()"
                (selectionChanged)="updateSelection($event)"
              />

              <nav
                aria-label="Paginación de usuarios"
                class="flex items-center justify-between gap-3 rounded-lg bg-white p-4"
              >
                <button
                  type="button"
                  data-testid="bulk-page-previous"
                  [disabled]="currentPage() <= 1 || bulkProcessing()"
                  (click)="loadUsers(currentPage() - 1)"
                  class="siga-focus text-sm text-[#611232] disabled:opacity-40"
                >
                  Anterior
                </button>

                <span class="text-xs text-gray-600">
                  Página {{ currentPage() }} de {{ lastPage() }}
                </span>

                <button
                  type="button"
                  data-testid="bulk-page-next"
                  [disabled]="currentPage() >= lastPage() || bulkProcessing()"
                  (click)="loadUsers(currentPage() + 1)"
                  class="siga-focus text-sm text-[#611232] disabled:opacity-40"
                >
                  Siguiente
                </button>
              </nav>
            }

            @if (selectedUsers().length > 0) {
              <div
                data-testid="bulk-page-selection-preview"
                class="rounded-xl border border-[#e7e2e3] bg-white p-4"
              >
                <h3 class="text-sm font-semibold text-[#611232]">
                  Personal seleccionado
                </h3>

                <ul class="mt-3 space-y-2">
                  @for (user of selectedUsers(); track user.id) {
                    <li class="flex items-center justify-between gap-3 text-sm">
                      <span>
                        {{ user.person?.nombres }}
                        {{ user.person?.apellido_paterno }}
                        {{ user.person?.apellido_materno }}
                        — {{ user.email }}
                      </span>

                      <button
                        type="button"
                        [attr.aria-label]="'Excluir a ' + user.name"
                        [disabled]="bulkProcessing()"
                        (click)="updateSelection({ user, selected: false })"
                        class="siga-focus text-xs font-semibold text-[#611232] underline"
                      >
                        Excluir
                      </button>
                    </li>
                  }
                </ul>
              </div>
            }

            @if (bulkError()) {
              <p
                role="alert"
                data-testid="bulk-page-error"
                class="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700"
              >
                {{ bulkError() }}
              </p>
            }

            @if (bulkNotice()) {
              <p
                role="status"
                data-testid="bulk-page-result"
                class="rounded-xl border border-green-200 bg-white p-4 text-sm text-green-800"
              >
                {{ bulkNotice() }}
              </p>
            }

            @if (!selectedRole() || selectedUserIds().length === 0) {
              <section
                data-testid="bulk-page-operation-placeholder"
                aria-label="Estado de revisión de asignación masiva"
                class="min-h-36 rounded-xl border border-[#e7e2e3] bg-white p-5"
              >
                <h2 class="text-base font-semibold text-[#611232]">
                  3. Revisar y confirmar asignación
                </h2>

                @if (bulkResult()) {
                  <p class="mt-3 text-sm text-gray-600">
                    La última operación concluyó. Consulta el resultado
                    detallado en la siguiente sección o selecciona otro rol y
                    nuevos usuarios para iniciar otra asignación.
                  </p>
                } @else {
                  <p class="mt-3 text-sm text-gray-600">
                    Selecciona un rol y al menos un usuario vinculado a Personas
                    para habilitar la revisión y confirmación administrativa.
                  </p>
                }
              </section>
            }

            @if (selectedRole() && selectedUserIds().length > 0) {
              <section
                data-testid="bulk-page-operation-summary"
                class="rounded-xl border border-[#a57f2c]/30 bg-white p-5 space-y-4"
              >
                <h2 class="text-base font-semibold text-[#611232]">
                  3. Revisar y confirmar asignación
                </h2>

                <p class="text-sm text-gray-700">
                  Rol:
                  <strong
                    >{{ selectedRole()!.code }} ·
                    {{ selectedRole()!.name }}</strong
                  >
                </p>

                <p class="text-sm text-gray-700">
                  Usuarios seleccionados:
                  <strong>{{ selectedUserIds().length }}</strong>
                </p>

                @if (!bulkConfirmationOpen()) {
                  <button
                    type="button"
                    data-testid="bulk-page-open-confirmation"
                    [disabled]="bulkProcessing()"
                    (click)="openBulkConfirmation()"
                    class="siga-focus rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Revisar y confirmar asignación
                  </button>
                } @else {
                  <div
                    data-testid="bulk-page-confirmation"
                    class="space-y-4 border-t border-[#e7e2e3] pt-4"
                  >
                    <h3 class="text-sm font-semibold text-[#611232]">
                      Confirmación administrativa
                    </h3>

                    <p class="text-sm text-gray-600">
                      Confirma tu contraseña administrativa para solicitar a
                      Laravel la asignación del rol indicado.
                    </p>

                    <label
                      for="bulk-page-admin-password"
                      class="block text-sm font-medium text-[#611232]"
                    >
                      Contraseña administrativa
                    </label>

                    <input
                      id="bulk-page-admin-password"
                      data-testid="bulk-page-admin-password"
                      type="password"
                      autocomplete="off"
                      [formControl]="bulkReauthenticationForm.controls.password"
                      class="siga-focus w-full rounded-lg border border-[#ddd3d7] p-2 text-sm"
                    />

                    <div class="flex flex-wrap gap-3">
                      <button
                        type="button"
                        data-testid="bulk-page-confirm-assignment"
                        [disabled]="
                          bulkProcessing() || bulkReauthenticationForm.invalid
                        "
                        (click)="confirmBulkAssignment()"
                        class="siga-focus rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {{
                          bulkProcessing()
                            ? "Procesando..."
                            : "Confirmar asignación"
                        }}
                      </button>

                      <button
                        type="button"
                        data-testid="bulk-page-cancel-confirmation"
                        [disabled]="bulkProcessing()"
                        (click)="cancelBulkConfirmation()"
                        class="siga-focus rounded-lg border border-[#ddd3d7] px-4 py-2 text-sm text-[#611232] disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                }
              </section>
            }
          </section>

          @if (bulkResult(); as report) {
            <section
              data-testid="bulk-page-detailed-result"
              aria-label="Resultado detallado de asignación masiva"
              class="rounded-xl border border-[#e7e2e3] bg-white p-5"
            >
              <h2 class="text-base font-semibold text-[#611232]">
                4. Resultado de la asignación
              </h2>

              <p class="mt-2 text-sm text-gray-700">
                Rol:
                <strong>{{ report.role.code }} · {{ report.role.name }}</strong>
              </p>

              <div class="mt-4 grid gap-3 sm:grid-cols-3">
                <div class="rounded-lg border border-gray-200 p-3">
                  <p class="text-xs text-gray-600">Seleccionados</p>
                  <p class="text-xl font-semibold">{{ report.selected }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 p-3">
                  <p class="text-xs text-gray-600">Rol asignado</p>
                  <p class="text-xl font-semibold">{{ report.assigned }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 p-3">
                  <p class="text-xs text-gray-600">Ya tenían el rol</p>
                  <p class="text-xl font-semibold">
                    {{ report.alreadyAssigned }}
                  </p>
                </div>
              </div>

              <div class="mt-5 grid gap-5 lg:grid-cols-2">
                <section aria-label="Usuarios con rol asignado">
                  <h3 class="text-sm font-semibold text-[#611232]">
                    Rol asignado ({{ report.assigned }})
                  </h3>
                  <ul
                    data-testid="bulk-page-assigned-users"
                    class="mt-2 divide-y divide-gray-100"
                  >
                    @for (user of report.assignedUsers; track user.id) {
                      <li class="py-2 text-sm">
                        <p class="font-medium">{{ user.name }}</p>
                        <p class="text-xs text-gray-600">{{ user.email }}</p>
                      </li>
                    } @empty {
                      <li class="py-2 text-sm text-gray-600">
                        Ninguna asignación nueva.
                      </li>
                    }
                  </ul>
                </section>

                <section aria-label="Usuarios que ya tenían el rol">
                  <h3 class="text-sm font-semibold text-[#611232]">
                    Ya tenían el rol ({{ report.alreadyAssigned }})
                  </h3>
                  <ul
                    data-testid="bulk-page-already-assigned-users"
                    class="mt-2 divide-y divide-gray-100"
                  >
                    @for (user of report.alreadyAssignedUsers; track user.id) {
                      <li class="py-2 text-sm">
                        <p class="font-medium">{{ user.name }}</p>
                        <p class="text-xs text-gray-600">{{ user.email }}</p>
                      </li>
                    } @empty {
                      <li class="py-2 text-sm text-gray-600">
                        Ningún usuario tenía previamente este rol.
                      </li>
                    }
                  </ul>
                </section>
              </div>

              <p class="mt-4 text-xs text-gray-600">
                El reporte permanece visible para su revisión. Los usuarios con
                roles existentes no recibieron asignaciones duplicadas.
              </p>
            </section>
          }
        }
      }
    </main>
  `,
})
export class BulkRoleAssignmentPageComponent implements OnInit {
  private readonly authContext = inject(AuthContextService);
  private readonly authService = inject(AuthService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(UserListComponent)
  private userList?: UserListComponent;

  readonly operationMode = signal<"assign" | "remove">("assign");

  setOperationMode(mode: "assign" | "remove"): void {
    if (
      this.bulkProcessing() ||
      this.operationMode() === mode ||
      (mode === "assign" && !this.canAssignRoles()) ||
      (mode === "remove" && !this.canRemoveRoles())
    )
      return;

    this.cancelBulkConfirmation();
    ++this.usersRequestVersion;
    this.usersLoading.set(false);
    this.usersError.set(null);
    this.users.set([]);
    this.currentPage.set(1);
    this.lastPage.set(1);
    this.operationMode.set(mode);
    this.selectedRole.set(null);
    this.selectionStore.clear();
    this.highlightedUserIds.set([]);
    this.highlightVersion++;
    this.bulkResult.set(null);
    this.bulkError.set(null);
    this.bulkNotice.set(null);
    this.userList?.clearFilters();

    if (mode === "assign") {
      this.loadUsers(1);
    }
  }

  readonly users = signal<readonly UserSummary[]>([]);
  readonly currentPage = signal(1);
  readonly lastPage = signal(1);
  readonly usersLoading = signal(false);
  readonly usersError = signal<string | null>(null);

  private readonly selectionStore = new BulkRoleSelectionStore();
  readonly selectedUserIds = this.selectionStore.selectedUserIds;
  readonly highlightedUserIds = signal<readonly number[]>([]);
  private highlightVersion = 0;
  readonly selectedUsers = this.selectionStore.selectedUsers;

  readonly bulkResult = signal<{
    role: UserRole;
    selected: number;
    assigned: number;
    alreadyAssigned: number;
    assignedUsers: readonly UserSummary[];
    alreadyAssignedUsers: readonly UserSummary[];
  } | null>(null);

  private usersRequestVersion = 0;

  loadUsers(page: number): void {
    if (
      !this.canManageRoles() ||
      (this.operationMode() === "assign" && !this.canAssignRoles()) ||
      (this.operationMode() === "remove" &&
        (!this.canRemoveRoles() || this.selectedRole() === null)) ||
      this.usersLoading() ||
      page < 1 ||
      page > this.lastPage()
    ) {
      return;
    }

    this.usersLoading.set(true);
    this.usersError.set(null);

    const version = ++this.usersRequestVersion;
    const roleId =
      this.operationMode() === "remove" ? this.selectedRole()!.id : undefined;

    this.userService
      .list(page, roleId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (version !== this.usersRequestVersion) return;

          this.users.set(response.data);
          this.currentPage.set(response.meta.current_page);
          this.lastPage.set(response.meta.last_page);
          this.usersLoading.set(false);
        },
        error: () => {
          if (version !== this.usersRequestVersion) return;

          this.usersLoading.set(false);
          this.usersError.set(
            "No fue posible consultar los usuarios registrados.",
          );
        },
      });
  }

  updateSelection(event: { user: UserSummary; selected: boolean }): void {
    if (!this.canManageRoles() || this.bulkProcessing()) return;

    const changed = this.selectionStore.update(event, this.users());

    if (changed) {
      this.cancelBulkConfirmation();
    }
  }
  readonly availableRoles = signal<readonly UserRole[]>([]);
  readonly selectedRole = signal<UserRole | null>(null);
  readonly bulkConfirmationOpen = signal(false);
  readonly bulkProcessing = signal(false);
  readonly bulkError = signal<string | null>(null);
  readonly bulkNotice = signal<string | null>(null);
  readonly bulkReauthenticationForm = createUserRoleReauthenticationForm();
  readonly rolesLoading = signal(false);
  readonly rolesError = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.canManageRoles()) return;

    if (!this.canAssignRoles() && this.canRemoveRoles()) {
      this.operationMode.set("remove");
    }

    this.loadRoles();

    if (this.canAssignRoles()) {
      this.loadUsers(1);
    }
  }

  loadRoles(): void {
    if (!this.canManageRoles() || this.rolesLoading() || this.bulkProcessing())
      return;

    this.rolesLoading.set(true);
    this.rolesError.set(null);

    this.userRoleService
      .listRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const available = response.data.filter(
            (role) => role.code !== "ROL_ADMIN_SISTEMA",
          );

          this.availableRoles.set(available);

          if (
            this.selectedRole() &&
            !available.some((role) => role.id === this.selectedRole()!.id)
          ) {
            this.selectedRole.set(null);
          }

          this.rolesLoading.set(false);
        },
        error: () => {
          this.rolesLoading.set(false);
          this.rolesError.set("No fue posible consultar el catálogo de roles.");
        },
      });
  }

  selectRole(role: UserRole): void {
    if (
      !this.canManageRoles() ||
      this.rolesLoading() ||
      this.bulkProcessing() ||
      role.code === "ROL_ADMIN_SISTEMA" ||
      !this.availableRoles().some((item) => item.id === role.id)
    ) {
      return;
    }

    this.cancelBulkConfirmation();

    if (this.operationMode() === "remove") {
      ++this.usersRequestVersion;
      this.usersLoading.set(false);
      this.usersError.set(null);
      this.users.set([]);
      this.currentPage.set(1);
      this.lastPage.set(1);
      this.selectionStore.clear();
      this.highlightedUserIds.set([]);
      ++this.highlightVersion;
      this.bulkResult.set(null);
      this.bulkError.set(null);
      this.bulkNotice.set(null);
      this.userList?.clearFilters();
    }

    this.selectedRole.set(role);

    if (this.operationMode() === "remove") {
      this.loadUsers(1);
    }
  }

  openBulkConfirmation(): void {
    const role = this.selectedRole();
    const ids = this.selectedUserIds();
    const users = this.selectedUsers();

    if (
      this.bulkProcessing() ||
      !this.canAssignRoles() ||
      role === null ||
      role.code === "ROL_ADMIN_SISTEMA" ||
      !this.availableRoles().some((available) => available.id === role.id) ||
      ids.length === 0 ||
      ids.length > 100 ||
      new Set(ids).size !== ids.length ||
      users.length !== ids.length ||
      users.some((user) => user.person === null || !ids.includes(user.id))
    ) {
      return;
    }

    this.bulkError.set(null);
    this.bulkReauthenticationForm.reset();
    this.bulkConfirmationOpen.set(true);
  }

  cancelBulkConfirmation(): void {
    if (this.bulkProcessing()) return;

    this.bulkConfirmationOpen.set(false);
    this.bulkReauthenticationForm.reset();
  }
  confirmBulkAssignment(): void {
    if (this.operationMode() !== "assign") return;

    const role = this.selectedRole();
    const ids = [...this.selectedUserIds()];
    const users = this.selectedUsers();
    const password = this.bulkReauthenticationForm.controls.password.value;

    if (
      this.bulkProcessing() ||
      !this.bulkConfirmationOpen() ||
      !this.canAssignRoles() ||
      role === null ||
      role.code === "ROL_ADMIN_SISTEMA" ||
      !this.availableRoles().some((available) => available.id === role.id) ||
      ids.length === 0 ||
      ids.length > 100 ||
      new Set(ids).size !== ids.length ||
      users.length !== ids.length ||
      users.some((user) => user.person === null || !ids.includes(user.id)) ||
      this.bulkReauthenticationForm.invalid
    ) {
      return;
    }

    this.bulkProcessing.set(true);
    this.bulkError.set(null);
    this.bulkNotice.set(null);

    this.bulkReauthenticationForm.controls.password.disable({
      emitEvent: false,
    });

    let stage: "reauthentication" | "assignment" = "reauthentication";

    this.authService
      .reauthenticate(password)
      .pipe(
        switchMap(() => {
          stage = "assignment";
          this.bulkReauthenticationForm.reset();

          return this.userRoleService.assignRolesBulk(role.id, ids);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.bulkReauthenticationForm.controls.password.enable({
            emitEvent: false,
          });
          this.bulkReauthenticationForm.reset();
          this.bulkProcessing.set(false);
          this.bulkConfirmationOpen.set(false);

          const assignedIds = new Set(response.result.assigned_user_ids);
          const alreadyAssignedIds = new Set(
            response.result.already_assigned_user_ids,
          );

          const confirmedIds = new Set([...assignedIds, ...alreadyAssignedIds]);

          this.users.update((currentUsers) =>
            currentUsers.map((user) => {
              if (!confirmedIds.has(user.id)) {
                return user;
              }

              const existingRoles = user.roles ?? [];

              if (existingRoles.some((existing) => existing.id === role.id)) {
                return user;
              }

              return {
                ...user,
                roles: [
                  ...existingRoles,
                  {
                    id: role.id,
                    code: role.code,
                    name: role.name,
                  },
                ],
              };
            }),
          );

          this.highlightedUserIds.set([...confirmedIds]);

          const highlightVersion = ++this.highlightVersion;

          timer(8000)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              if (highlightVersion === this.highlightVersion) {
                this.highlightedUserIds.set([]);
              }
            });

          this.bulkResult.set({
            role,
            selected: response.result.selected,
            assigned: response.result.assigned,
            alreadyAssigned: response.result.already_assigned,
            assignedUsers: users.filter((user) => assignedIds.has(user.id)),
            alreadyAssignedUsers: users.filter((user) =>
              alreadyAssignedIds.has(user.id),
            ),
          });

          // La confirmación exitosa debe restaurar el directorio completo.
          // No se modifican los filtros cuando Laravel rechaza el lote.
          this.userList?.clearFilters();

          this.selectionStore.clear();
          this.selectedRole.set(null);

          this.bulkNotice.set(
            `Laravel confirmó ${response.result.assigned} asignaciones. ` +
              `${response.result.already_assigned} usuarios ya tenían el rol.`,
          );
        },
        error: (error: unknown) => {
          this.bulkReauthenticationForm.controls.password.enable({
            emitEvent: false,
          });
          this.bulkReauthenticationForm.reset();
          this.bulkProcessing.set(false);

          if (stage === "reauthentication") {
            this.bulkError.set(
              "No fue posible confirmar la contraseña administrativa.",
            );
            return;
          }

          if (error instanceof HttpErrorResponse) {
            if (error.status === 403) {
              this.bulkError.set(
                "No tienes autorización para asignar este rol.",
              );
              return;
            }

            if (error.status === 422) {
              this.bulkError.set(
                "Laravel rechazó el lote. Revisa los usuarios seleccionados.",
              );
              return;
            }

            if (error.status === 423) {
              this.bulkError.set(
                "La reautenticación ha caducado. Confirma nuevamente.",
              );
              return;
            }
          }

          this.bulkError.set(
            "No fue posible confirmar la asignación. " +
              "Comprueba el resultado antes de intentar nuevamente.",
          );
        },
      });
  }
  canRemoveRoles(): boolean {
    return (
      this.authContext.hasPermission("usuarios.retirar_roles_masivamente") &&
      this.authContext.hasPermission("usuarios.ver") &&
      this.authContext.hasPermission("roles.ver")
    );
  }

  canManageRoles(): boolean {
    return this.canAssignRoles() || this.canRemoveRoles();
  }

  canAssignRoles(): boolean {
    return (
      this.authContext.hasPermission("usuarios.asignar_roles") &&
      this.authContext.hasPermission("usuarios.ver") &&
      this.authContext.hasPermission("roles.ver")
    );
  }
}
