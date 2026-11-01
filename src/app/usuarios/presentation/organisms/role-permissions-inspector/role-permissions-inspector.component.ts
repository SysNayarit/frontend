import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

interface RoleOption {
  id: number;
  code: string;
  name?: string;
}

interface PermissionEffect {
  id: number;
  code: string;
  effect: string;
}

@Component({
  selector: "app-role-permissions-inspector",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-xl bg-white p-5 shadow-sm"
      aria-label="Permisos por rol">
      <h2 class="text-lg font-semibold text-[#611232]">
        Autorizaciones por rol
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        Consulta de reglas registradas. Los perfiles no conceden acceso.
        Laravel determina los permisos efectivos mediante DENY y ALLOW.
      </p>

      <label class="mt-4 block max-w-md text-sm font-medium">
        Seleccionar rol institucional
        <select class="mt-2 block w-full rounded-lg border px-3 py-2"
          [value]="selectedRole() ?? ''"
          (change)="selectRole($any($event.target).value)"
          aria-label="Seleccionar rol institucional">
          <option value="">Seleccionar un rol</option>
          @for (role of roles(); track role.id) {
            <option [value]="role.id">
              {{ role.name || role.code }}
            </option>
          }
        </select>
      </label>

      @if (loading()) {
        <p class="mt-4 text-sm" role="status">Consultando permisos...</p>
      }

      @if (error()) {
        <p class="mt-4 text-sm text-red-700" role="alert">
          {{ error() }}
        </p>
      }

      @if (!loading() && selectedRole() !== null && !error()) {
        <p class="mt-4 text-xs text-gray-600">
          {{ permissions().length }} reglas registradas
        </p>
        <ul class="mt-3 max-h-96 space-y-2 overflow-auto">
          @for (permission of permissions(); track permission.id) {
            <li class="flex items-center justify-between gap-3 rounded-lg border p-3">
              <code class="break-all text-sm">{{ permission.code }}</code>
              <span class="rounded-full px-3 py-1 text-xs font-semibold"
                [class.bg-red-100]="permission.effect === 'DENY'"
                [class.text-red-800]="permission.effect === 'DENY'"
                [class.bg-green-100]="permission.effect === 'ALLOW'"
                [class.text-green-800]="permission.effect === 'ALLOW'">
                {{ permission.effect }}
              </span>
            </li>
          } @empty {
            <li class="text-sm text-gray-500">
              Este rol no tiene reglas de permiso registradas.
            </li>
          }
        </ul>
        <p class="mt-3 text-xs text-gray-500">
          Esta vista muestra reglas del rol seleccionado, no calcula
          los permisos efectivos de un usuario con múltiples roles.
        </p>
      }
    </section>
  `,
})
export class RolePermissionsInspectorComponent {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private requestVersion = 0;

  readonly roles = input<readonly RoleOption[]>([]);
  readonly selectedRole = signal<number | null>(null);
  readonly permissions = signal<PermissionEffect[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  selectRole(value: string): void {
    const id = Number(value);
    const version = ++this.requestVersion;

    this.permissions.set([]);
    this.error.set(null);
    this.selectedRole.set(null);
    this.loading.set(false);

    if (value === "") return;

    if (!Number.isSafeInteger(id) ||
        id < 1 ||
        !this.roles().some(role => role.id === id)) {
      this.error.set("Selecciona un rol válido del catálogo.");
      return;
    }

    this.selectedRole.set(id);
    this.loading.set(true);

    this.http.get<{ data: PermissionEffect[] }>(
      `/api/roles/${id}/permisos`
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        if (version !== this.requestVersion) return;
        this.permissions.set(response.data);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        if (version !== this.requestVersion) return;
        this.loading.set(false);
        const status = error instanceof HttpErrorResponse
          ? error.status : 0;
        this.error.set(
          status === 403
            ? "No tienes autorización para consultar los permisos de este rol."
            : status === 404
              ? "El rol seleccionado ya no existe."
              : "No fue posible consultar las reglas del rol."
        );
      },
    });
  }
}
