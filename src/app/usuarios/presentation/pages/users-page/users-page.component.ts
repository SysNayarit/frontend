import { UsersModuleNavigationComponent } from "../../molecules/users-module-navigation/users-module-navigation.component";
import { UserAccessPanelComponent } from "../../organisms/user-access-panel/user-access-panel.component";
import { UserAccessResponse } from "../../../user-access.models";
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
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
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
    UserAccessPanelComponent,
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

      <section
        aria-label="Estados de acceso de usuarios"
        data-testid="user-access-states-guide"
        class="rounded-xl border border-[#e7e2e3] bg-white p-4"
      >
        <h2 class="text-sm font-semibold text-[#611232]">
          Estados de acceso
        </h2>

        <div class="mt-3 grid gap-3 md:grid-cols-3">
          <div class="rounded-lg bg-amber-50 p-3">
            <p class="text-sm font-medium text-amber-900">
              Pendiente de habilitación
            </p>
            <p class="mt-1 text-xs text-gray-700">
              Cuenta registrada, a la espera de autorización inicial.
            </p>
          </div>

          <div class="rounded-lg bg-green-50 p-3">
            <p class="text-sm font-medium text-green-900">
              Habilitado
            </p>
            <p class="mt-1 text-xs text-gray-700">
              Acceso autorizado, sujeto a los permisos efectivos.
            </p>
          </div>

          <div class="rounded-lg bg-red-50 p-3">
            <p class="text-sm font-medium text-red-900">
              Deshabilitado
            </p>
            <p class="mt-1 text-xs text-gray-700">
              Acceso retirado, conservando la cuenta y su historial.
            </p>
          </div>
        </div>

        <p class="mt-3 text-xs leading-5 text-gray-600">
          Las cuentas nuevas inician pendientes.
          Las acciones administrativas permiten habilitar o deshabilitar.
          No existe una acción ordinaria para regresar a Pendiente.
          Las transiciones requieren autorización y reautenticación.
        </p>
      </section>
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
        @if (accessRefreshError()) {
          <p
            role="alert"
            data-testid="access-refresh-warning"
            class="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
          >
            {{ accessRefreshError() }}
          </p>
        }
        <section
          aria-label="Filtros globales de acceso"
          class="mb-4 rounded-xl border border-[#e7e2e3] bg-white p-4"
        >
          <h3 class="text-sm font-semibold text-[#611232]">
            Filtros institucionales
          </h3>
          <p class="mt-1 text-xs text-gray-600">
            Estos filtros consultan todas las cuentas en Laravel,
            antes de aplicar la paginación.
          </p>

          <div class="mt-3 grid gap-3 md:grid-cols-2">
            <label class="text-xs font-medium text-gray-700">
              Estado administrativo
              <select
                data-testid="users-server-status"
                class="mt-1 block w-full rounded-lg border border-gray-300 p-2 text-sm"
                [value]="serverStatus()"
                [disabled]="loading()"
                (change)="applyStatusFilter($any($event.target).value)"
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="HABILITADO">Habilitado</option>
                <option value="DESHABILITADO">Deshabilitado</option>
              </select>
            </label>

            <label class="text-xs font-medium text-gray-700">
              Restricción administrativa
              <select
                data-testid="users-server-restriction"
                class="mt-1 block w-full rounded-lg border border-gray-300 p-2 text-sm"
                [value]="serverRestriction()"
                [disabled]="loading()"
                (change)="applyRestrictionFilter($any($event.target).value)"
              >
                <option value="">Todas</option>
                <option value="blocked">Bloqueo de seguridad</option>
                <option value="suspended">Suspensión vigente</option>
                <option value="validity_future">Vigencia futura</option>
                <option value="validity_expired">Vigencia vencida</option>
              </select>
            </label>
          </div>
        </section>

        <app-user-list
          [users]="users()"
          [selectedUserId]="selectedUser()?.id ?? null"
          [detailTemplate]="null"
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
              <app-user-access-panel [user]="selectedUser()!" [roles]="selectedRoles()" [rolesLoading]="rolesLoading()" [rolesError]="rolesError()" [blocked]="roleOperationProcessing()" (busy)="accessProcessing.set($event)" (changed)="accessChanged($event)" />
              @if (canDeliverCadetCredential()) {
                <section
                  data-testid="siga-initial-credential"
                  class="mt-4 rounded-xl border border-[#a57f2c]/40 bg-white p-4"
                >
                  <h3 class="font-semibold text-[#611232]">
                    Entrega presencial de credencial inicial
                  </h3>

                  <p class="mt-2 text-sm text-gray-600">
                    Solo para cadetes con cuenta PENDIENTE.
                    Verifica personalmente al titular antes de emitir.
                    No se habilita la cuenta con esta operacion.
                  </p>

                  <label class="mt-3 flex items-start gap-2 text-sm">
                    <input
                      #verifiedRecipient
                      type="checkbox"
                      [checked]="initialRecipientVerified()"
                      (change)="initialRecipientVerified.set(verifiedRecipient.checked)"
                    />
                    He verificado la identidad y el titular esta presente.
                  </label>

                  <label
                    for="siga-credential-operator-password"
                    class="mt-3 block text-sm font-semibold"
                  >
                    Contraseña institucional del operador
                  </label>

                  <input
                    #operatorPassword
                    id="siga-credential-operator-password"
                    type="password"
                    autocomplete="current-password"
                    [disabled]="initialPasswordLoading()"
                    (input)="initialOperatorPasswordPresent.set(operatorPassword.value.length > 0)"
                    class="mt-2 block w-full max-w-md rounded-lg border p-3"
                  />

                  <button
                    type="button"
                    (click)="issueInitialPassword(operatorPassword.value); operatorPassword.value = ''; initialOperatorPasswordPresent.set(false)"
                    [disabled]="!initialRecipientVerified() || !initialOperatorPasswordPresent() || initialPasswordLoading() || initialPassword() !== null"
                    class="mt-3 rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {{ initialPasswordLoading()
                      ? "Generando..."
                      : "Generar para entrega presencial" }}
                  </button>

                  @if (initialPasswordError(); as message) {
                    <p role="alert" class="mt-3 text-sm text-red-800">
                      {{ message }}
                    </p>
                  }

                  @if (initialPassword(); as secret) {
                    <div
                      role="status"
                      class="mt-4 rounded-lg border border-amber-400 p-4"
                    >
                      <p class="font-semibold">
                        Contraseña inicial: mostrar una sola vez
                      </p>

                      <p class="mt-2 break-all font-mono text-lg">
                        {{ secret }}
                      </p>

                      <p class="mt-2 text-xs text-gray-700">
                        Entrega directamente al titular verificado.
                        No tomes capturas ni generes reportes de credenciales.
                        Al ocultarla, no podra recuperarse.
                      </p>

                      <button
                        type="button"
                        (click)="initialPassword.set(null)"
                        class="mt-3 rounded-lg border px-3 py-2 font-semibold"
                      >
                        Ocultar contraseña entregada
                      </button>
                    </div>
                  }
                </section>
              }
              <app-user-roles
                [user]="selectedUser()"
                [roles]="selectedRoles()"
                [totalRoles]="totalRoles()"
                [canManageRoles]="canManageRoles() && !accessProcessing()"
                [canRemoveRoles]="canRemoveRoles() && !accessProcessing()"
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
        @if (selectedUser()) {
          <section
            data-testid="siga-user-administration-detail"
            aria-label="Administracion del usuario seleccionado"
            class="mt-4 min-w-0"
          >
            <p
              role="status"
              class="mb-3 rounded-lg border border-[#a57f2c]/30 bg-white p-3 text-sm text-[#611232]"
            >
              Detalle administrativo abierto.
              El directorio institucional permanece visible arriba.
            </p>
            <ng-container [ngTemplateOutlet]="detalleUsuario" />
          </section>
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
  private readonly credentialHttp = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly destroyRef = inject(DestroyRef);

  // SIGA_C1_ENTREGA_PRESENCIAL_UI_V1
  readonly initialPassword = signal<string | null>(null);
  readonly initialPasswordError = signal<string | null>(null);
  readonly initialPasswordLoading = signal(false);
  readonly initialRecipientVerified = signal(false);
  readonly initialOperatorPasswordPresent = signal(false);

  canDeliverCadetCredential(): boolean {
    const target = this.selectedUser();

    return (
      target !== null &&
      target.access_status === "PENDIENTE" &&
      target.email.toLowerCase().endsWith("@institucion.mx") &&
      this.authContext.hasPermission("usuarios.ver") &&
      this.authContext.hasPermission("usuarios.crear") &&
      this.authContext.hasPermission("usuarios.habilitar")
    );
  }

  issueInitialPassword(operatorPassword: string): void {
    const target = this.selectedUser();

    if (
      !target ||
      !this.canDeliverCadetCredential() ||
      !this.initialRecipientVerified() ||
      !operatorPassword ||
      this.initialPasswordLoading() ||
      this.accessProcessing() ||
      this.roleOperationProcessing()
    ) {
      return;
    }

    const userId = target.id;

    if (!window.confirm(
      `Confirmar identidad verificada presencialmente.\n\n` +
      `Usuario: ${target.email}\n\n` +
      `SIGA generara una nueva contraseña para entrega directa. ` +
      `La anterior dejara de funcionar.`
    )) {
      return;
    }

    this.initialPassword.set(null);
    this.initialPasswordError.set(null);
    this.initialPasswordLoading.set(true);

    this.authService.reauthenticate(operatorPassword).pipe(
      switchMap(() => this.credentialHttp.post<{
        usuario_id: number;
        password_inicial: string;
        mostrar_una_vez: boolean;
      }>(
        `/api/usuarios/${userId}/credencial-inicial`,
        { entrega_presencial_confirmada: true }
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        if (
          this.selectedUser()?.id !== userId ||
          response.usuario_id !== userId ||
          response.mostrar_una_vez !== true ||
          !/^[a-f0-9]{40}$/.test(response.password_inicial)
        ) {
          this.initialPasswordError.set(
            "La respuesta no pudo verificarse. " +
            "No reintentes sin revisar la cuenta."
          );
        } else {
          this.initialPassword.set(response.password_inicial);
        }

        this.initialPasswordLoading.set(false);
        this.initialRecipientVerified.set(false);
      },
      error: (error: unknown) => {
        const status = error instanceof HttpErrorResponse
          ? error.status
          : 0;

        this.initialPasswordError.set(
          `La credencial no pudo entregarse (HTTP ${status}). ` +
          "Comprueba la sesion, permisos y estado del usuario."
        );

        this.initialPasswordLoading.set(false);
        this.initialRecipientVerified.set(false);
      },
    });
  }
  readonly accessProcessing = signal(false);
  readonly accessRefreshError = signal<string | null>(null);
  private accessRefreshVersion = 0;
  accessChanged(response: UserAccessResponse): void {
    this.users.update(users =>
      users.map(user =>
        user.id === response.id
          ? { ...user, access_status: response.access_status }
          : user
      )
    );

    this.selectedUser.update(user =>
      user?.id === response.id
        ? { ...user, access_status: response.access_status }
        : user
    );

    this.accessRefreshError.set(null);

    const version = ++this.accessRefreshVersion;
    const page = this.currentPage();

    // Solo GET. No repetir habilitacion ni deshabilitacion.
    this.userService
      .list(page, undefined, {
        accessStatus: this.serverStatus(),
        restriction: this.serverRestriction(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fresh) => {
          if (
            version !== this.accessRefreshVersion ||
            page !== this.currentPage()
          ) {
            return;
          }

          const lastValidPage = Math.max(1, fresh.meta.last_page);

          // Una operacion confirmada puede eliminar la ultima
          // fila de la pagina actual bajo el filtro activo.
          if (page > lastValidPage) {
            this.closeUserRoles();

            if (fresh.meta.total === 0) {
              this.users.set([]);
              this.currentPage.set(1);
              this.lastPage.set(1);
              this.total.set(0);
              this.accessRefreshError.set(null);
              return;
            }

            this.lastPage.set(lastValidPage);
            this.accessRefreshError.set(null);

            // La consulta ordinaria recupera la pagina valida.
            // No se repite la operacion administrativa.
            this.loadPage(lastValidPage);
            return;
          }

          const confirmed = fresh.data.find(
            user => user.id === response.id
          );

          // La cuenta puede dejar de cumplir el estado o la
          // restriccion seleccionada tras el cambio confirmado.
          const excludedByActiveFilter =
            !confirmed &&
            (
              (this.serverStatus() !== "" &&
                this.serverStatus() !== response.access_status) ||
              this.serverRestriction() !== ""
            );

          if (excludedByActiveFilter) {
            this.closeUserRoles();
            this.users.set(fresh.data);
            this.currentPage.set(fresh.meta.current_page);
            this.lastPage.set(fresh.meta.last_page);
            this.total.set(fresh.meta.total);
            this.accessRefreshError.set(null);
            return;
          }

          if (
            !confirmed ||
            confirmed.access_status !== response.access_status
          ) {
            this.accessRefreshError.set(
              "La consulta posterior no coincide con el cambio confirmado. " +
              "Actualiza el listado y verifica el estado antes de repetir."
            );
            return;
          }

          this.users.set(fresh.data);

          this.selectedUser.update(current =>
            current?.id === response.id ? confirmed : current
          );

          this.currentPage.set(fresh.meta.current_page);
          this.lastPage.set(fresh.meta.last_page);
          this.total.set(fresh.meta.total);
          this.accessRefreshError.set(null);
        },
        error: (error: unknown) => {
          if (version !== this.accessRefreshVersion) {
            return;
          }

          const codigo = error instanceof HttpErrorResponse
            ? ` HTTP ${error.status}.`
            : "";

          this.accessRefreshError.set(
            "Laravel confirmó el cambio, pero no se pudo actualizar " +
            "el listado." + codigo +
            " Consulta nuevamente antes de repetir la operación."
          );
        },
      });
  }

  readonly serverStatus = signal("");
  readonly serverRestriction = signal("");

  applyStatusFilter(value: string): void {
    if (
      this.loading() ||
      this.roleOperationProcessing() ||
      this.accessProcessing() ||
      value === this.serverStatus()
    ) {
      return;
    }

    this.closeUserRoles();
    this.serverStatus.set(value);
    this.loadPage(1);
  }

  applyRestrictionFilter(value: string): void {
    if (
      this.loading() ||
      this.roleOperationProcessing() ||
      this.accessProcessing() ||
      value === this.serverRestriction()
    ) {
      return;
    }

    this.closeUserRoles();
    this.serverRestriction.set(value);
    this.loadPage(1);
  }

  readonly users = signal<readonly UserSummary[]>([]);
  readonly currentPage = signal(1);
  readonly lastPage = signal(1);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private requestVersion = 0;

  readonly selectedUser = signal<UserSummary | null>(null);
  readonly selectedRoles = signal<readonly UserRole[]>([]);
  readonly totalRoles = signal<number | null>(null);
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


  canManageRoles(): boolean {
    return this.authContext.hasPermission("usuarios.asignar_roles");
  }
  canRemoveRoles(): boolean {
    return this.authContext.hasPermission("usuarios.retirar_roles");
  }
  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    if (this.loading() || page < 1 || page > this.lastPage()) {
      return;
    }

    // Una navegación nueva invalida cualquier refresco
    // de acceso correspondiente a una vista anterior.
    this.accessRefreshVersion++;

    this.loading.set(true);
    this.error.set(null);

    const version = ++this.requestVersion;

    this.userService
      .list(page, undefined, {
        accessStatus: this.serverStatus(),
        restriction: this.serverRestriction(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: UserListResponse) => {
          if (version !== this.requestVersion) {
            return;
          }

          const lastValidPage = Math.max(1, response.meta.last_page);

          // Los filtros pueden reducir el total mientras el
          // operador consulta una pagina anteriormente valida.
          if (page > lastValidPage) {
            if (this.roleOperationProcessing() || this.accessProcessing()) {
              this.error.set(
                "El numero de paginas cambio durante una operacion. " +
                "Consulta nuevamente al finalizar.",
              );
              this.loading.set(false);
              return;
            }

            // No conservar una seleccion fuera del contexto.
            this.closeUserRoles();

            if (response.meta.total === 0) {
              this.users.set([]);
              this.currentPage.set(1);
              this.lastPage.set(1);
              this.total.set(0);
              this.loading.set(false);
              return;
            }

            // Un solo salto a la ultima pagina disponible.
            this.lastPage.set(lastValidPage);
            this.loading.set(false);
            this.loadPage(lastValidPage);
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
      (this.roleOperationProcessing() || this.accessProcessing()) ||
      user === null ||
      role === null ||
      !(this.selectedRoleOperation() === "remove" ? this.canRemoveRoles() : this.canManageRoles()) ||
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
      (this.roleOperationProcessing() || this.accessProcessing()) ||
      this.selectedUser() === null ||
      !this.canRemoveRoles() ||
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
      (this.roleOperationProcessing() || this.accessProcessing()) ||
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
    if ((this.roleOperationProcessing() || this.accessProcessing())) {
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
    if ((this.roleOperationProcessing() || this.accessProcessing())) {
      return;
    }

    if (this.roleSelectorOpen()) {
      this.closeRoleSelector();
      return;
    }

    if (
      (this.roleOperationProcessing() || this.accessProcessing()) ||
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
    if (
      this.roleOperationProcessing() ||
      this.accessProcessing() ||
      this.initialPasswordLoading()
    ) {
      return;
    }

    if (this.selectedUser()?.id === user.id) {
      this.closeUserRoles();
      return;
    }

    this.initialPassword.set(null);
    this.initialPasswordError.set(null);
    this.initialRecipientVerified.set(false);
    this.initialOperatorPasswordPresent.set(false);

    this.roleOperationNotice.set(null);
    this.closeRoleConfirmation();
    this.closeRoleSelector();
    this.selectedUser.set(user);
    this.selectedRoles.set([]);
    this.totalRoles.set(null);
    this.loadUserRoles(user.id);
  }

  closeUserRoles(): void {
    if (
      this.roleOperationProcessing() ||
      this.accessProcessing() ||
      this.initialPasswordLoading()
    ) {
      return;
    }

    this.roleOperationNotice.set(null);
    this.closeRoleConfirmation();
    this.closeRoleSelector();
    this.rolesRequestVersion++;
    this.initialPassword.set(null);
    this.initialPasswordError.set(null);
    this.initialRecipientVerified.set(false);
    this.initialOperatorPasswordPresent.set(false);
    this.selectedUser.set(null);
    this.selectedRoles.set([]);
    this.totalRoles.set(null);
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
          this.totalRoles.set(
            Number.isInteger(response.meta?.total_roles) &&
            (response.meta?.total_roles ?? 0) > 0
              ? response.meta!.total_roles
              : null
          );
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
          this.totalRoles.set(null);
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
