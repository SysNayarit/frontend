import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs";

import { AuthContextService } from "../../../../auth/auth-context.service";
import { AuthService } from "../../../../auth/auth.service";

interface AssignedProfile {
  id: number;
  name: string;
  code: string;
  is_default: boolean;
  group: { id: number; code: string; name: string };
}

interface ProfileResponse {
  user_id: number;
  data: AssignedProfile[];
}

@Component({
  selector: "app-user-profile-administration",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-xl bg-white p-5 shadow-sm"
      aria-label="Administración de perfiles asignados">
      <h2 class="text-lg font-semibold text-[#611232]">
        Perfiles asignados a usuarios
      </h2>
      <p class="mt-1 text-sm text-gray-600">
        Los perfiles personalizan la interfaz; no otorgan permisos.
      </p>

      @if (canRead()) {
        <form class="mt-4 flex flex-wrap items-end gap-3"
          (submit)="findUser($event)">
          <label class="text-sm font-medium">
            Identificador de usuario
            <input type="number" min="1" step="1"
              [value]="userInput()"
              (input)="userInput.set($any($event.target).value)"
              class="mt-1 block rounded-lg border px-3 py-2"
              data-testid="profile-user-id" />
          </label>
          <button type="submit" [disabled]="busy()"
            class="siga-focus rounded-lg bg-[#611232] px-4 py-2 text-white">
            Consultar perfiles
          </button>
        </form>
      } @else {
        <p class="mt-3 text-sm text-gray-600">
          Se requiere autorización para consultar perfiles de otros usuarios.
        </p>
      }

      @if (message()) {
        <p role="status" class="mt-3 text-sm">{{ message() }}</p>
      }
      @if (error()) {
        <p role="alert" class="mt-3 text-sm text-red-700">{{ error() }}</p>
      }

      @if (selectedUserId() !== null && canRead()) {
        <h3 class="mt-5 font-semibold">
          Usuario {{ selectedUserId() }}
        </h3>

        <ul class="mt-3 space-y-2">
          @for (profile of assigned(); track profile.id) {
            <li class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <strong>{{ profile.name }}</strong>
                <span class="ml-2 text-xs text-gray-500">{{ profile.code }}</span>
                @if (profile.is_default) {
                  <span class="ml-2 text-xs font-semibold text-[#611232]">
                    Predeterminado
                  </span>
                }
              </div>
              @if (canManage() && (!profile.is_default || assigned().length === 1)) {
                <button type="button" [disabled]="busy()"
                  class="siga-focus rounded-lg border px-3 py-2 text-sm"
                  (click)="prepare('remove', profile.id)">
                  Retirar
                </button>
              }
            </li>
          } @empty {
            <li class="text-sm text-gray-500">Sin perfiles asignados.</li>
          }
        </ul>

        @if (canManage()) {
          <div class="mt-4 flex flex-wrap items-end gap-3">
            <label class="text-sm font-medium">
              Asignar un perfil disponible
              <select class="mt-1 block rounded-lg border px-3 py-2"
                [value]="profileInput()"
                (change)="profileInput.set($any($event.target).value)">
                <option value="">Seleccionar perfil</option>
                @for (profile of availableProfiles(); track profile.id) {
                  <option [value]="profile.id">{{ profile.name }}</option>
                }
              </select>
            </label>
            <button type="button" [disabled]="busy() || !profileInput()"
              class="siga-focus rounded-lg bg-[#611232] px-4 py-2 text-white"
              (click)="prepare('assign', NumberValue(profileInput()))">
              Solicitar asignación
            </button>
          </div>
        }
      }

      @if (pending() !== null) {
        <form class="mt-5 rounded-lg border border-amber-300 p-4"
          (submit)="confirm($event)">
          <h3 class="font-semibold">Confirmar operación administrativa</h3>
          <p class="mt-2 text-sm">
            {{ pending()!.type === 'assign' ? 'Asignar' : 'Retirar' }}
            perfil {{ pending()!.profileId }}
            al usuario {{ selectedUserId() }}.
          </p>
          <label class="mt-3 block text-sm">
            Contraseña para reautenticación
            <input type="password" autocomplete="current-password"
              [value]="password()"
              (input)="password.set($any($event.target).value)"
              class="mt-1 block w-full max-w-sm rounded-lg border px-3 py-2" />
          </label>
          <div class="mt-3 flex gap-3">
            <button type="submit" [disabled]="busy() || !password()"
              class="siga-focus rounded-lg bg-[#611232] px-4 py-2 text-white">
              Confirmar
            </button>
            <button type="button" [disabled]="busy()" (click)="cancel()"
              class="siga-focus rounded-lg border px-4 py-2">
              Cancelar
            </button>
          </div>
        </form>
      }
    </section>
  `,
})
export class UserProfileAdministrationComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly context = inject(AuthContextService);
  private readonly destroyRef = inject(DestroyRef);

  readonly userInput = signal("");
  readonly selectedUserId = signal<number | null>(null);
  readonly assigned = signal<AssignedProfile[]>([]);
  readonly availableProfiles = signal<{ id: number; name: string }[]>([]);
  readonly profileInput = signal("");
  readonly pending = signal<{ type: "assign" | "remove"; profileId: number } | null>(null);
  readonly password = signal("");
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  canRead(): boolean {
    return this.context.hasPermission("usuarios.ver") &&
      this.context.hasPermission("perfiles.ver");
  }

  canManage(): boolean {
    return this.canRead() &&
      this.context.hasPermission("usuarios.asignar_perfiles");
  }

  NumberValue(value: string): number {
    return Number(value);
  }

  findUser(event: Event): void {
    event.preventDefault();
    const id = Number(this.userInput());
    if (!Number.isSafeInteger(id) || id < 1 || !this.canRead()) {
      this.error.set("Introduce un identificador de usuario válido.");
      return;
    }

    this.cancel();
    this.selectedUserId.set(null);
    this.assigned.set([]);
    this.message.set(null);
    this.error.set(null);
    this.busy.set(true);

    this.http.get<ProfileResponse>(`/api/usuarios/${id}/perfiles`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.selectedUserId.set(result.user_id);
          this.assigned.set(result.data);
          this.busy.set(false);
          if (this.canManage()) this.loadCatalog();
        },
        error: e => {
          this.busy.set(false);
          this.showError(e);
        },
      });
  }

  private loadCatalog(): void {
    this.http.get<{ data: { id: number; name: string }[] }>("/api/perfiles")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => this.availableProfiles.set(
          result.data.filter(p => !this.assigned().some(a => a.id === p.id))
        ),
        error: e => this.showError(e),
      });
  }

  prepare(type: "assign" | "remove", profileId: number): void {
    if (!this.canManage() || this.busy() ||
      !Number.isSafeInteger(profileId) || profileId < 1) return;
    if (type === "remove" &&
      !this.assigned().some(
        p => p.id === profileId &&
          (!p.is_default || this.assigned().length === 1)
      )) return;
    if (type === "assign" &&
      !this.availableProfiles().some(p => p.id === profileId)) return;

    this.error.set(null);
    this.password.set("");
    this.pending.set({ type, profileId });
  }

  cancel(): void {
    this.pending.set(null);
    this.password.set("");
  }

  confirm(event: Event): void {
    event.preventDefault();
    const operation = this.pending();
    const id = this.selectedUserId();
    if (!operation || id === null || !this.canManage() ||
      !this.password() || this.busy()) return;

    this.busy.set(true);
    this.error.set(null);
    const secret = this.password();
    this.password.set("");

    this.auth.reauthenticate(secret).pipe(
      switchMap(() =>
        operation.type === "assign"
          ? this.http.post(`/api/usuarios/${id}/perfiles`, {
              profile_id: operation.profileId,
            })
          : this.http.delete(
              `/api/usuarios/${id}/perfiles/${operation.profileId}`
            )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.cancel();
        this.message.set("Operación confirmada. Actualizando perfiles...");
        this.http.get<ProfileResponse>(`/api/usuarios/${id}/perfiles`)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: data => {
              this.assigned.set(data.data);
              this.message.set("Perfiles actualizados correctamente.");
              this.busy.set(false);
              this.loadCatalog();
              this.context.notifyOtherTabs("permissions");
            },
            error: e => {
              this.busy.set(false);
              this.message.set(
                "La operación fue aceptada, pero no se pudo confirmar el listado."
              );
              this.showError(e);
            },
          });
      },
      error: e => {
        this.busy.set(false);
        this.cancel();
        this.showError(e);
      },
    });
  }

  private showError(error: unknown): void {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    this.error.set(
      status === 401 ? "La sesión no es válida o la reautenticación falló." :
      status === 403 ? "Laravel denegó la operación por permisos." :
      status === 404 ? "Usuario o perfil no encontrado." :
      status === 422 ? "Operación no permitida: revisa el perfil predeterminado." :
      "No se pudo completar la consulta u operación."
    );
  }
}
