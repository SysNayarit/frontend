import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  input,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { switchMap } from "rxjs";
import { AuthService } from "../../../../auth/auth.service";
import { UserListResponse, UserSummary } from "../../../user.models";

interface Role {
  id: number;
  code: string;
  name: string;
}

interface Rule {
  id: number;
  code: string;
  effect: string;
}

@Component({
  selector: "app-user-role-permissions-browser",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-4" aria-label="Usuarios y sus roles">
      <header class="rounded-xl bg-white p-5">
        <h2 class="text-lg font-bold text-[#611232]">
          Usuarios y sus roles
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Selecciona un usuario y abre cualquiera de sus roles para
          consultar los permisos que tiene registrados.
        </p>
      </header>

      <div class="rounded-xl bg-white p-5">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <label class="text-sm font-semibold">
            Buscar en esta página de usuarios
            <input type="search"
              [value]="search()"
              (input)="search.set($any($event.target).value)"
              placeholder="Nombre o correo"
              class="mt-2 block w-full rounded-lg border px-3 py-2"
              data-testid="users-search" />
          </label>

          <p class="text-xs text-gray-600">
            Página {{ page() }} de {{ lastPage() }}
            · {{ total() }} usuarios
          </p>
        </div>

        @if (loadingUsers()) {
          <p role="status" class="mt-4">Cargando usuarios...</p>
        }

        @if (usersError()) {
          <div class="mt-4" role="alert">
            <p class="text-sm text-red-700">{{ usersError() }}</p>
            <button type="button" (click)="loadUsers()"
              class="siga-focus mt-2 rounded-lg border px-3 py-2">
              Reintentar
            </button>
          </div>
        }

        @if (!loadingUsers() && !usersError()) {
          <ul class="mt-4 space-y-2">
            @for (user of filteredUsers(); track user.id) {
              <li class="rounded-lg border p-3">
                <button type="button"
                  [attr.aria-expanded]="selectedUserId() === user.id"
                  (click)="selectUser(user)"
                  class="siga-focus flex w-full items-center justify-between gap-3 text-left">
                  <span>
                    <strong class="block text-sm">
                      {{ personName(user) }}
                    </strong>
                    <span class="block text-xs text-gray-600">
                      {{ user.email }}
                    </span>
                    <span class="block text-xs text-[#611232]">
                      {{ user.roles?.length ?? 0 }} roles asignados
                    </span>
                  </span>
                  <span class="text-sm font-semibold text-[#611232]">
                    {{ selectedUserId() === user.id ? 'Ocultar' : 'Ver roles' }}
                  </span>
                </button>

                @if (selectedUserId() === user.id) {
                  <div class="mt-3 border-t pt-3">
                    <p class="mb-3 text-xs text-gray-600">
                      Selecciona un rol para desplegar sus permisos.
                    </p>
                    @for (role of user.roles ?? []; track role.id) {
                      <div class="mb-2 rounded-lg border p-3">
                        <button type="button"
                          [attr.aria-expanded]="selectedRoleId() === role.id"
                          (click)="selectRole(role)"
                          class="siga-focus flex w-full items-center justify-between gap-2 text-left">
                          <span class="text-sm font-semibold">
                            {{ role.name }}
                          </span>
                          <span class="text-sm text-[#611232]">
                            {{ selectedRoleId() === role.id
                              ? 'Ocultar permisos'
                              : 'Ver permisos' }}
                          </span>
                        </button>

                        @if (selectedRoleId() === role.id) {
                          @if (loadingRules()) {
                            <p role="status" class="mt-3 text-sm">
                              Consultando permisos...
                            </p>
                          } @else if (rulesError()) {
                            <p role="alert" class="mt-3 text-sm text-red-700">
                              {{ rulesError() }}
                            </p>
                          } @else {
                            <div class="mt-3 border-t pt-3">
                              <p class="mb-2 text-xs text-gray-600">
                                ALLOW: regla de permiso.
                                DENY: regla de denegación.
                                Una regla individual no representa
                                por sí sola el acceso efectivo.
                              </p>
                              <ul class="space-y-2">
                                @for (rule of rules(); track rule.id) {
                                  <li class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 p-2">
                                    <div>
                                      <code class="text-xs">{{ rule.code }}</code>
                                      @if (hasStagedChange(rule)) {
                                        <p class="text-xs text-amber-800">
                                          Modificado · sin guardar
                                        </p>
                                      }
                                    </div>
                                    @if (role.code !== 'ROL_ADMIN_SISTEMA') {
                                      <button type="button"
                                        [disabled]="saving()"
                                        [attr.aria-label]="'Cambiar ' + rule.code + ' de ' + rule.effect"
                                        (click)="stageToggle(rule)"
                                        class="siga-focus rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50"
                                        [class.border-red-400]="displayedEffect(rule) === 'DENY'"
                                        [class.text-red-800]="displayedEffect(rule) === 'DENY'"
                                        [class.border-green-500]="displayedEffect(rule) === 'ALLOW'"
                                        [class.text-green-800]="displayedEffect(rule) === 'ALLOW'">
                                        {{ displayedEffect(rule) }} ↔
                                      </button>
                                    } @else {
                                      <strong class="text-xs"
                                        [class.text-red-700]="displayedEffect(rule) === 'DENY'"
                                        [class.text-green-800]="displayedEffect(rule) === 'ALLOW'">
                                        {{ rule.effect }}
                                      </strong>
                                    }
                                  </li>
                                } @empty {
                                  <li class="text-sm text-gray-500">
                                    Este rol no tiene reglas registradas.
                                  </li>
                                }
                              </ul>

                              @if (pendingCount() > 0) {
                                <form (submit)="confirmBatch($event)"
                                  class="mt-4 space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4"
                                  data-testid="batch-confirmation">
                                  <h3 class="text-sm font-bold text-[#611232]">
                                    Cambios pendientes: {{ pendingCount() }}
                                  </h3>

                                  <ul class="space-y-1 text-sm">
                                    @for (change of pendingChanges(); track change.permission_id) {
                                      <li>
                                        {{ change.code }}:
                                        {{ change.expected_effect }} →
                                        <strong>{{ change.effect }}</strong>
                                      </li>
                                    }
                                  </ul>

                                  <p class="text-xs text-gray-700">
                                    Los cambios todavía no están guardados.
                                    Al confirmar, afectarán a todos los usuarios
                                    que tengan este rol.
                                  </p>

                                  @if (canManage()) {
                                    <label class="block text-sm">
                                      Contraseña para autorizar el guardado
                                      <input type="password"
                                        autocomplete="current-password"
                                        [value]="password()"
                                        (input)="password.set($any($event.target).value)"
                                        class="mt-1 block w-full rounded-lg border px-3 py-2" />
                                    </label>
                                  } @else {
                                    <p role="status" class="text-sm text-red-800">
                                      Puedes preparar y revisar cambios, pero
                                      necesitas roles.administrar_permisos
                                      para guardarlos.
                                    </p>
                                  }

                                  <div class="flex flex-wrap gap-2">
                                    <button type="submit"
                                      data-testid="confirm-batch"
                                      [disabled]="saving()"
                                      class="siga-focus rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                                      {{ saving() ? 'Guardando...' : 'Confirmar cambios (' + pendingCount() + ')' }}
                                    </button>

                                    <button type="button"
                                      data-testid="discard-batch"
                                      [disabled]="saving()"
                                      (click)="discardChanges()"
                                      class="siga-focus rounded-lg border px-4 py-2 text-sm">
                                      Descartar cambios
                                    </button>
                                  </div>
                                </form>
                              }
                              @if (changeError()) {
                                <p role="alert" class="mt-3 text-sm text-red-700">
                                  {{ changeError() }}
                                </p>
                              }
                              @if (changeMessage()) {
                                <p role="status" class="mt-3 text-sm text-green-800">
                                  {{ changeMessage() }}
                                </p>
                              }
                            </div>
                          }
                        }
                      </div>
                    } @empty {
                      <p class="text-sm text-gray-600">
                        Este usuario no tiene roles asignados.
                      </p>
                    }
                  </div>
                }
              </li>
            } @empty {
              <li class="text-sm text-gray-600">
                No hay coincidencias en esta página.
              </li>
            }
          </ul>

          <div class="mt-4 flex justify-between gap-3">
            <button type="button"
              class="siga-focus rounded-lg border px-4 py-2 text-sm"
              [disabled]="page() <= 1"
              (click)="goToPage(page() - 1)">
              Anterior
            </button>
            <button type="button"
              class="siga-focus rounded-lg border px-4 py-2 text-sm"
              [disabled]="page() >= lastPage()"
              (click)="goToPage(page() + 1)">
              Siguiente
            </button>
          </div>
        }
      </div>

      <p class="rounded-xl border bg-white p-4 text-sm text-gray-600">
        Esta pantalla consulta permisos existentes. Agregar o quitar
        permisos a un rol requiere una operación administrativa
        protegida que aún no está disponible en Laravel.
      </p>
    </section>
  `,
})
export class UserRolePermissionsBrowserComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private usersRequest = 0;
  private rulesRequest = 0;

  readonly canManage = input(false);
  readonly staged = signal<Record<number, "ALLOW" | "DENY">>({});
  readonly pending = signal<Rule | null>(null);
  readonly password = signal("");
  readonly saving = signal(false);
  readonly changeError = signal<string | null>(null);
  readonly changeMessage = signal<string | null>(null);

  readonly users = signal<UserSummary[]>([]);
  readonly page = signal(1);
  readonly lastPage = signal(1);
  readonly total = signal(0);
  readonly search = signal("");
  readonly selectedUserId = signal<number | null>(null);
  readonly selectedRoleId = signal<number | null>(null);
  readonly rules = signal<Rule[]>([]);
  readonly loadingUsers = signal(false);
  readonly loadingRules = signal(false);
  readonly usersError = signal<string | null>(null);
  readonly rulesError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUsers();
  }

  personName(user: UserSummary): string {
    const person = user.person;
    if (!person) return user.name;

    return [
      person.nombres,
      person.apellido_paterno,
      person.apellido_materno,
    ].filter(Boolean).join(" ");
  }

  filteredUsers(): UserSummary[] {
    const query = this.search().trim().toLocaleLowerCase();
    if (!query) return this.users();

    return this.users().filter(user =>
      `${this.personName(user)} ${user.email}`
        .toLocaleLowerCase().includes(query)
    );
  }

  goToPage(value: number): void {
    if (!Number.isSafeInteger(value) ||
        value < 1 || value > this.lastPage()) return;

    this.page.set(value);
    this.search.set("");
    this.loadUsers();
  }

  loadUsers(): void {
    this.cancelToggle();
    this.discardChanges();
    const version = ++this.usersRequest;
    ++this.rulesRequest;
    this.selectedUserId.set(null);
    this.selectedRoleId.set(null);
    this.rules.set([]);
    this.loadingRules.set(false);
    this.loadingUsers.set(true);
    this.usersError.set(null);

    this.http.get<UserListResponse>(
      "/api/usuarios",
      { params: { page: this.page() } }
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (version !== this.usersRequest) return;
        this.users.set(result.data);
        this.page.set(result.meta.current_page);
        this.lastPage.set(result.meta.last_page);
        this.total.set(result.meta.total);
        this.loadingUsers.set(false);
      },
      error: (error: unknown) => {
        if (version !== this.usersRequest) return;
        this.loadingUsers.set(false);
        this.usersError.set(
          error instanceof HttpErrorResponse && error.status === 403
            ? "No tienes permiso para consultar los usuarios."
            : "No fue posible cargar los usuarios."
        );
      },
    });
  }

  selectUser(user: UserSummary): void {
    this.cancelToggle();
    this.discardChanges();
    ++this.rulesRequest;
    this.selectedRoleId.set(null);
    this.rules.set([]);
    this.rulesError.set(null);
    this.loadingRules.set(false);
    this.selectedUserId.set(
      this.selectedUserId() === user.id ? null : user.id
    );
  }

  selectRole(role: Role): void {
    this.cancelToggle();
    this.discardChanges();
    const version = ++this.rulesRequest;
    const open = this.selectedRoleId() !== role.id;
    this.selectedRoleId.set(open ? role.id : null);
    this.rules.set([]);
    this.rulesError.set(null);
    this.loadingRules.set(false);

    if (!open) return;

    this.loadingRules.set(true);
    this.http.get<{ data: Rule[] }>(
      `/api/roles/${role.id}/permisos`
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        if (version !== this.rulesRequest) return;
        this.rules.set(response.data);
        this.loadingRules.set(false);
      },
      error: (error: unknown) => {
        if (version !== this.rulesRequest) return;
        this.loadingRules.set(false);
        this.rulesError.set(
          error instanceof HttpErrorResponse && error.status === 403
            ? "Laravel denegó la consulta de permisos."
            : "No fue posible consultar los permisos de este rol."
        );
      },
    });
  }

  prepareToggle(rule: Rule): void {
    if (!this.canManage() ||
        this.saving() ||
        this.selectedRoleId() === null ||
        !["ALLOW", "DENY"].includes(rule.effect) ||
        !this.rules().some(p =>
          p.id === rule.id &&
          p.code === rule.code &&
          p.effect === rule.effect
        )) return;

    const user = this.users().find(u => u.id === this.selectedUserId());
    const role = user?.roles?.find(r => r.id === this.selectedRoleId());

    if (!role || role.code === "ROL_ADMIN_SISTEMA") return;

    this.pending.set({ ...rule });
    this.password.set("");
    this.changeError.set(null);
    this.changeMessage.set(null);
  }

  cancelToggle(): void {
    if (this.saving()) return;
    this.pending.set(null);
    this.password.set("");
  }

  confirmToggle(event: Event): void {
    event.preventDefault();

    const rule = this.pending();
    const roleId = this.selectedRoleId();
    const userId = this.selectedUserId();
    const secret = this.password();

    if (!rule || !roleId || !userId || !secret ||
        this.saving() || !this.canManage()) return;

    const nextEffect = rule.effect === "ALLOW" ? "DENY" : "ALLOW";
    const version = this.rulesRequest;

    this.saving.set(true);
    this.password.set("");
    this.changeError.set(null);

    this.authService.reauthenticate(secret).pipe(
      switchMap(() => this.http.patch<{
        data: {
          role_id: number;
          permission_id: number;
          previous_effect: string;
          effect: string;
        };
      }>(`/api/roles/${roleId}/permisos/${rule.id}`, {
        expected_effect: rule.effect,
        effect: nextEffect,
      })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        this.saving.set(false);
        this.pending.set(null);
        if (version !== this.rulesRequest ||
            this.selectedUserId() !== userId ||
            this.selectedRoleId() !== roleId) return;

        if (response.data.role_id !== roleId ||
            response.data.permission_id !== rule.id ||
            response.data.previous_effect !== rule.effect ||
            response.data.effect !== nextEffect) {
          this.changeError.set(
            "La respuesta no coincide con la solicitud. Actualiza los permisos."
          );
          return;
        }

        this.rules.update(current => current.map(item =>
          item.id === rule.id
            ? { ...item, effect: nextEffect }
            : item
        ));
        this.changeMessage.set(
          `Permiso ${rule.code} actualizado a ${nextEffect}.`
        );
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.pending.set(null);
        if (version !== this.rulesRequest) return;

        const status = error instanceof HttpErrorResponse
          ? error.status : 0;

        this.changeError.set(
          status === 409
            ? "El permiso fue modificado por otra operación. Cierra y vuelve a abrir el rol para actualizar."
            : status === 403
              ? "Laravel denegó el cambio. No se modificó el permiso."
              : status === 401
                ? "La reautenticación no fue válida."
                : status === 422
                  ? "Operación rechazada por las reglas de seguridad."
                  : "No fue posible confirmar el cambio."
        );
      },
    });
  }
  displayedEffect(rule: Rule): string {
    return this.staged()[rule.id] ?? rule.effect;
  }

  hasStagedChange(rule: Rule): boolean {
    return Object.prototype.hasOwnProperty.call(this.staged(), rule.id);
  }

  stageToggle(rule: Rule): void {
    if (this.saving() || this.loadingRules() ||
        this.selectedRoleId() === null) return;

    const user = this.users().find(u => u.id === this.selectedUserId());
    const role = user?.roles?.find(r => r.id === this.selectedRoleId());

    if (!role || role.code === "ROL_ADMIN_SISTEMA") return;

    const original = this.rules().find(item => item.id === rule.id);
    if (!original || !["ALLOW", "DENY"].includes(original.effect)) return;

    const next = this.displayedEffect(original) === "ALLOW"
      ? "DENY" : "ALLOW";

    this.staged.update(current => {
      const updated = { ...current };
      if (next === original.effect) {
        delete updated[rule.id];
      } else {
        updated[rule.id] = next;
      }
      return updated;
    });

    this.changeError.set(null);
    this.changeMessage.set(null);
  }

  pendingChanges(): Array<{
    permission_id: number;
    code: string;
    expected_effect: string;
    effect: string;
  }> {
    return this.rules()
      .filter(rule => this.hasStagedChange(rule))
      .map(rule => ({
        permission_id: rule.id,
        code: rule.code,
        expected_effect: rule.effect,
        effect: this.staged()[rule.id],
      }));
  }

  pendingCount(): number {
    return this.pendingChanges().length;
  }

  discardChanges(): void {
    if (this.saving()) return;
    this.staged.set({});
    this.password.set("");
    this.changeError.set(null);
  }

  confirmBatch(event: Event): void {
    event.preventDefault();

    const roleId = this.selectedRoleId();
    const userId = this.selectedUserId();
    const changes = this.pendingChanges();
    const secret = this.password();

    if (!this.canManage()) {
      this.changeError.set(
        "No se pueden guardar los cambios: tu cuenta necesita el permiso roles.administrar_permisos. Solicita habilitar una cuenta operadora autorizada."
      );
      return;
    }

    if (this.saving() ||
        roleId === null || userId === null ||
        changes.length === 0 || changes.length > 100 ||
        !secret) return;

    const user = this.users().find(u => u.id === userId);
    const role = user?.roles?.find(r => r.id === roleId);
    if (!role || role.code === "ROL_ADMIN_SISTEMA") return;

    const version = this.rulesRequest;
    this.saving.set(true);
    this.password.set("");
    this.changeError.set(null);
    this.changeMessage.set(null);

    this.authService.reauthenticate(secret).pipe(
      switchMap(() => this.http.patch<{
        role_id: number;
        updated: number;
        data: Array<{
          permission_id: number;
          code: string;
          previous_effect: string;
          effect: string;
        }>;
      }>(`/api/roles/${roleId}/permisos/lote`, {
        changes: changes.map(change => ({
          permission_id: change.permission_id,
          expected_effect: change.expected_effect,
          effect: change.effect,
        })),
      })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: result => {
        this.saving.set(false);

        if (version !== this.rulesRequest ||
            this.selectedRoleId() !== roleId ||
            this.selectedUserId() !== userId) return;

        const valid =
          result.role_id === roleId &&
          result.updated === changes.length &&
          result.data.length === changes.length &&
          changes.every(change => result.data.some(saved =>
            saved.permission_id === change.permission_id &&
            saved.code === change.code &&
            saved.previous_effect === change.expected_effect &&
            saved.effect === change.effect
          ));

        if (!valid) {
          this.changeError.set(
            "La respuesta no coincide con los cambios solicitados. Recarga el rol."
          );
          return;
        }

        this.rules.update(current => current.map(rule => {
          const saved = result.data.find(
            item => item.permission_id === rule.id
          );
          return saved ? { ...rule, effect: saved.effect } : rule;
        }));

        this.staged.set({});
        this.changeMessage.set(
          `${changes.length} permisos actualizados correctamente.`
        );
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const status = error instanceof HttpErrorResponse
          ? error.status : 0;

        this.changeError.set(
          status === 409
            ? "Otro operador modificó los permisos. Recarga este rol antes de confirmar."
            : status === 403
              ? "No tienes autorización para guardar estos cambios."
              : status === 401
                ? "La reautenticación no fue válida."
                : status === 422
                  ? "Laravel rechazó los cambios por una regla de seguridad."
                  : "No fue posible guardar los cambios."
        );
      },
    });
  }}
