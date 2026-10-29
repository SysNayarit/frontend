import { UsersModuleNavigationComponent } from "../../molecules/users-module-navigation/users-module-navigation.component";
import { NgTemplateOutlet } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { switchMap, type Observable } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { AuthContextService } from "../../../../auth/auth-context.service";
import { AuthService } from "../../../../auth/auth.service";

import { UserListResponse, UserSummary } from "../../../user.models";
import { UserRole } from "../../../user-role.models";
import { UserRoleService } from "../../../user-role.service";
import { UserService } from "../../../user.service";
import { UserListComponent } from "../../organisms/user-list/user-list.component";
import { UserRolesComponent } from "../../organisms/user-roles/user-roles.component";
import { createUserRoleReauthenticationForm } from "../../forms/user-role-reauthentication-form";
import { UserRoleOperation } from "../../organisms/user-role-confirmation/user-role-confirmation.component";
import { UsersPaginationComponent } from "../../molecules/users-pagination/users-pagination.component";

@Component({
  selector: "app-users-page",
  standalone: true,
  imports: [
    UsersModuleNavigationComponent,
    NgTemplateOutlet,
    ReactiveFormsModule,
    UserListComponent,
    UserRolesComponent,
    UsersPaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <app-users-module-navigation />
      <header class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <p
          class="text-xs font-semibold uppercase tracking-widest text-[#9b2247]"
        >
          Administración
        </p>

        <h1 class="mt-2 text-3xl font-bold text-[#611232]">
          Gestión de usuarios
        </h1>

        <p class="mt-3 text-sm leading-6 text-[#555555]">
          Consulta las cuentas institucionales registradas en SIGA.
        </p>
      </header>

      @if (loading()) {
        <p
          role="status"
          data-testid="users-loading"
          class="rounded-xl bg-white p-5 text-sm text-[#555555]"
        >
          Cargando usuarios...
        </p>
      }

      @if (error()) {
        <div
          role="alert"
          data-testid="users-error"
          class="rounded-xl border border-red-200 bg-white p-5"
        >
          <p class="text-sm font-medium text-red-700">
            {{ error() }}
          </p>

          <button
            type="button"
            class="siga-focus mt-4 rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white"
            (click)="reload()"
          >
            Reintentar
          </button>
        </div>
      }

      @if (!loading() && !error()) {
        <div class="mb-3">
          <h2 class="text-base font-semibold text-[#611232]">
            Usuarios registrados
          </h2>
          <p class="mt-1 text-xs text-gray-600">
            Consulta las cuentas existentes y administra individualmente sus
            roles, según tus permisos.
          </p>
        </div>
        <app-user-list
          [users]="users()"
          [selectedUserId]="selectedUser()?.id ?? null"
          [detailTemplate]="detalleUsuario"
          (userSelected)="selectUser($event)"
        />

        <ng-template #detalleUsuario>
          <div class="rounded-xl border border-[#e7e2e3] bg-[#faf9f9] p-4">
            @if (selectedUser() && roleOperationNotice()) {
              <p
                role="status"
                data-testid="role-operation-notice"
                class="rounded-xl border border-[#a57f2c]/30 bg-white p-4 text-sm font-medium text-[#611232]"
              >
                {{ roleOperationNotice() }}
              </p>
            }

            @if (selectedUser()) {
              <app-user-roles
                [user]="selectedUser()"
                [roles]="selectedRoles()"
                [canManageRoles]="canManageRoles()"
                [loading]="rolesLoading()"
                [error]="rolesError()"
                (close)="closeUserRoles()"
                (retry)="retryUserRoles()"
                (assignRequested)="openRoleSelector()"
                [roleSelectorOpen]="roleSelectorOpen()"
                [roleCatalog]="roleCatalog()"
                [roleCatalogLoading]="roleCatalogLoading()"
                [roleCatalogError]="roleCatalogError()"
                (availableRoleSelected)="selectRoleForAssignment($event)"
                (roleCatalogRetry)="retryRoleCatalog()"
                (roleCatalogCancel)="closeRoleSelector()"
                (removeRequested)="openRoleRemoval($event)"
                [selectedRoleOperation]="selectedRoleOperation()"
                [selectedRoleForOperation]="selectedRoleForOperation()"
                [roleReauthenticationForm]="roleReauthenticationForm"
                [roleOperationProcessing]="roleOperationProcessing()"
                [rolePasswordError]="rolePasswordError()"
                [roleOperationError]="roleOperationError()"
                (confirmRoleOperation)="confirmRoleAssignment()"
                (cancelRoleOperation)="closeRoleConfirmation()"
              />
            }
          </div>
        </ng-template>
        @if (
          selectedUser() &&
          !users().some((user) => user.id === selectedUser()!.id)
        ) {
          <ng-container [ngTemplateOutlet]="detalleUsuario" />
        }

        @if (selectedUser() && !selectedUserVisible()) {
          <ng-container [ngTemplateOutlet]="detalleUsuario" />
        }

        <app-users-pagination
          [currentPage]="currentPage()"
          [lastPage]="lastPage()"
          [total]="total()"
          [disabled]="loading()"
          (pageChange)="loadPage($event)"
        />
      }
    </div>
  `,
})
export class UsersPageComponent implements OnInit {
  private readonly authContext = inject(AuthContextService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<readonly UserSummary[]>([]);
  readonly currentPage = signal(1);
  readonly lastPage = signal(1);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private requestVersion = 0;

  readonly selectedUser = signal<UserSummary | null>(null);
  readonly selectedRoles = signal<readonly UserRole[]>([]);
  readonly rolesLoading = signal(false);
  readonly rolesError = signal<string | null>(null);

  private rolesRequestVersion = 0;

  readonly roleOperationProcessing = signal(false);
  readonly rolePasswordError = signal<string | null>(null);
  readonly roleOperationError = signal<string | null>(null);
  readonly roleOperationNotice = signal<string | null>(null);

  private roleOperationVersion = 0;
  readonly selectedRoleOperation = signal<UserRoleOperation>("assign");
  readonly selectedRoleForOperation = signal<UserRole | null>(null);
  readonly roleReauthenticationForm = createUserRoleReauthenticationForm();
  readonly roleSelectorOpen = signal(false);
  readonly roleCatalog = signal<readonly UserRole[]>([]);
  readonly roleCatalogLoading = signal(false);
  readonly roleCatalogError = signal<string | null>(null);

  private roleCatalogRequestVersion = 0;

  selectedUserVisible(): boolean {
    const selected = this.selectedUser();
    return (
      selected !== null && this.users().some((user) => user.id === selected.id)
    );
  }
  canManageRoles(): boolean {
    return this.authContext.hasPermission("usuarios.asignar_roles");
  }
  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    if (this.loading() || page < 1 || page > this.lastPage()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const version = ++this.requestVersion;

    this.userService
      .list(page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: UserListResponse) => {
          if (version !== this.requestVersion) {
            return;
          }

          this.users.set(response.data);
          this.currentPage.set(response.meta.current_page);
          this.lastPage.set(response.meta.last_page);
          this.total.set(response.meta.total);
          this.loading.set(false);
        },
        error: () => {
          if (version !== this.requestVersion) {
            return;
          }

          this.error.set(
            "No fue posible consultar los usuarios. Intenta nuevamente.",
          );
          this.loading.set(false);
        },
      });
  }

  private isCurrentRoleOperation(
    version: number,
    userId: number,
    roleId: number,
  ): boolean {
    return (
      version === this.roleOperationVersion &&
      this.roleOperationProcessing() &&
      this.selectedUser()?.id === userId &&
      this.selectedRoleForOperation()?.id === roleId
    );
  }
  confirmRoleAssignment(): void {
    const user = this.selectedUser();
    const role = this.selectedRoleForOperation();
    const password = this.roleReauthenticationForm.controls.password.value;

    if (
      this.roleOperationProcessing() ||
      user === null ||
      role === null ||
      !this.canManageRoles() ||
      (this.selectedRoleOperation() === "assign" &&
        !this.authContext.hasPermission("roles.ver")) ||
      role.code === "ROL_ADMIN_SISTEMA" ||
      (this.selectedRoleOperation() === "assign" &&
        this.selectedRoles().some((item) => item.id === role.id)) ||
      (this.selectedRoleOperation() === "remove" &&
        !this.selectedRoles().some((item) => item.id === role.id)) ||
      this.roleReauthenticationForm.invalid
    ) {
      return;
    }

    const version = ++this.roleOperationVersion;
    const userId = user.id;
    const roleId = role.id;
    const operation = this.selectedRoleOperation();

    this.roleOperationProcessing.set(true);
    this.rolePasswordError.set(null);
    this.roleOperationError.set(null);

    this.authService
      .reauthenticate(password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (!this.isCurrentRoleOperation(version, userId, roleId)) {
            return;
          }

          this.roleReauthenticationForm.reset();

          const roleRequest: Observable<unknown> =
            operation === "remove"
              ? this.userRoleService.removeRole(userId, roleId)
              : this.userRoleService.assignRole(userId, roleId);

          roleRequest.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
              if (!this.isCurrentRoleOperation(version, userId, roleId)) {
                return;
              }

              this.roleOperationProcessing.set(false);
              this.closeRoleConfirmation();
              this.roleOperationNotice.set(
                operation === "remove"
                  ? "Laravel confirmó el retiro. Actualizando los roles del usuario."
                  : "Laravel confirmó la asignación. Actualizando los roles del usuario.",
              );
              this.loadUserRoles(userId);
            },
            error: (error: unknown) => {
              if (!this.isCurrentRoleOperation(version, userId, roleId)) {
                return;
              }

              this.roleOperationProcessing.set(false);

              if (error instanceof HttpErrorResponse) {
                if (error.status === 403) {
                  this.roleOperationError.set(
                    operation === "remove"
                      ? "No tienes autorización para retirar este rol."
                      : "No tienes autorización para asignar este rol.",
                  );
                  return;
                }

                if (error.status === 423) {
                  this.roleOperationError.set(
                    "La reautenticación ha caducado. Confirma nuevamente tu identidad.",
                  );
                  return;
                }

                if (error.status === 422) {
                  this.roleOperationError.set(
                    operation === "remove"
                      ? "Laravel rechazó el retiro del rol seleccionado."
                      : "Laravel rechazó la asignación del rol seleccionado.",
                  );
                  return;
                }
              }

              this.roleOperationError.set(
                operation === "remove"
                  ? "No fue posible completar el retiro del rol."
                  : "No fue posible completar la asignación del rol.",
              );
            },
          });
        },
        error: (error: unknown) => {
          if (version !== this.roleOperationVersion) {
            return;
          }

          this.roleReauthenticationForm.reset();
          this.roleOperationProcessing.set(false);

          if (error instanceof HttpErrorResponse && error.status === 422) {
            this.rolePasswordError.set(
              "No fue posible confirmar la contraseña.",
            );
            return;
          }

          this.roleOperationError.set(
            "No fue posible completar la reautenticación.",
          );
        },
      });
  }
  openRoleRemoval(role: UserRole): void {
    if (
      this.roleOperationProcessing() ||
      this.selectedUser() === null ||
      !this.canManageRoles() ||
      this.rolesLoading() ||
      this.rolesError() !== null ||
      role.code === "ROL_ADMIN_SISTEMA" ||
      !this.selectedRoles().some((item) => item.id === role.id)
    ) {
      return;
    }

    if (
      this.selectedRoleOperation() === "remove" &&
      this.selectedRoleForOperation()?.id === role.id
    ) {
      this.closeRoleConfirmation();
      return;
    }

    this.closeRoleSelector();
    this.closeRoleConfirmation();
    this.selectedRoleOperation.set("remove");
    this.selectedRoleForOperation.set(role);
  }
  openRoleConfirmation(role: UserRole): void {
    const user = this.selectedUser();

    if (
      this.roleOperationProcessing() ||
      user === null ||
      !this.canManageRoles() ||
      role.code === "ROL_ADMIN_SISTEMA" ||
      this.selectedRoles().some((item) => item.id === role.id)
    ) {
      return;
    }

    this.closeRoleConfirmation();
    this.selectedRoleOperation.set("assign");
    this.selectedRoleForOperation.set(role);
  }

  closeRoleConfirmation(): void {
    if (this.roleOperationProcessing()) {
      return;
    }

    this.roleOperationVersion++;
    this.selectedRoleForOperation.set(null);
    this.selectedRoleOperation.set("assign");
    this.roleReauthenticationForm.reset();
    this.rolePasswordError.set(null);
    this.roleOperationError.set(null);
  }
  openRoleSelector(): void {
    if (this.roleOperationProcessing()) {
      return;
    }

    if (this.roleSelectorOpen()) {
      this.closeRoleSelector();
      return;
    }

    if (
      this.roleOperationProcessing() ||
      this.selectedRoleForOperation() !== null ||
      !this.canManageRoles() ||
      !this.authContext.hasPermission("roles.ver") ||
      this.selectedUser() === null ||
      this.rolesLoading() ||
      this.rolesError() !== null ||
      this.roleSelectorOpen()
    ) {
      return;
    }

    this.roleSelectorOpen.set(true);
    this.loadRoleCatalog();
  }

  closeRoleSelector(): void {
    this.roleCatalogRequestVersion++;
    this.roleSelectorOpen.set(false);
    this.roleCatalog.set([]);
    this.roleCatalogLoading.set(false);
    this.roleCatalogError.set(null);
  }

  retryRoleCatalog(): void {
    if (
      this.roleSelectorOpen() &&
      !this.roleCatalogLoading() &&
      this.canManageRoles() &&
      this.authContext.hasPermission("roles.ver")
    ) {
      this.loadRoleCatalog();
    }
  }

  selectRoleForAssignment(role: UserRole): void {
    if (
      !this.roleSelectorOpen() ||
      this.roleCatalogLoading() ||
      this.roleCatalogError() !== null ||
      !this.canManageRoles() ||
      !this.authContext.hasPermission("roles.ver") ||
      role.code === "ROL_ADMIN_SISTEMA" ||
      !this.roleCatalog().some((item) => item.id === role.id) ||
      this.selectedRoles().some((item) => item.id === role.id)
    ) {
      return;
    }

    this.closeRoleSelector();
    this.openRoleConfirmation(role);
  }

  private loadRoleCatalog(): void {
    const userId = this.selectedUser()?.id;

    if (
      userId === undefined ||
      !this.roleSelectorOpen() ||
      !this.canManageRoles() ||
      !this.authContext.hasPermission("roles.ver")
    ) {
      return;
    }

    const version = ++this.roleCatalogRequestVersion;

    this.roleCatalog.set([]);
    this.roleCatalogLoading.set(true);
    this.roleCatalogError.set(null);

    this.userRoleService
      .listRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (
            version !== this.roleCatalogRequestVersion ||
            !this.roleSelectorOpen() ||
            this.selectedUser()?.id !== userId
          ) {
            return;
          }

          this.roleCatalog.set(response.data);
          this.roleCatalogLoading.set(false);
        },
        error: () => {
          if (
            version !== this.roleCatalogRequestVersion ||
            !this.roleSelectorOpen() ||
            this.selectedUser()?.id !== userId
          ) {
            return;
          }

          this.roleCatalogError.set(
            "No fue posible consultar el catálogo de roles.",
          );
          this.roleCatalogLoading.set(false);
        },
      });
  }
  selectUser(user: UserSummary): void {
    if (this.roleOperationProcessing()) {
      return;
    }

    if (this.selectedUser()?.id === user.id) {
      this.closeUserRoles();
      return;
    }

    this.roleOperationNotice.set(null);
    this.closeRoleConfirmation();
    this.closeRoleSelector();
    this.selectedUser.set(user);
    this.selectedRoles.set([]);
    this.loadUserRoles(user.id);
  }

  closeUserRoles(): void {
    if (this.roleOperationProcessing()) {
      return;
    }

    this.roleOperationNotice.set(null);
    this.closeRoleConfirmation();
    this.closeRoleSelector();
    this.rolesRequestVersion++;
    this.selectedUser.set(null);
    this.selectedRoles.set([]);
    this.rolesLoading.set(false);
    this.rolesError.set(null);
  }

  retryUserRoles(): void {
    const user = this.selectedUser();

    if (user !== null && !this.rolesLoading()) {
      this.loadUserRoles(user.id);
    }
  }

  private loadUserRoles(userId: number): void {
    const version = ++this.rolesRequestVersion;

    this.rolesLoading.set(true);
    this.rolesError.set(null);

    this.userRoleService
      .listUserRoles(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (
            version !== this.rolesRequestVersion ||
            this.selectedUser()?.id !== userId
          ) {
            return;
          }

          this.selectedRoles.set(response.data);
          this.rolesLoading.set(false);
        },
        error: () => {
          if (
            version !== this.rolesRequestVersion ||
            this.selectedUser()?.id !== userId
          ) {
            return;
          }

          this.selectedRoles.set([]);
          this.rolesError.set(
            "No fue posible consultar los roles del usuario.",
          );
          this.rolesLoading.set(false);
        },
      });
  }
  reload(): void {
    this.loadPage(this.currentPage());
  }
}
