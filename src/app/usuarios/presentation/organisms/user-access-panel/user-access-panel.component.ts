import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Subscription, switchMap } from "rxjs";
import { AuthContextService } from "../../../../auth/auth-context.service";
import { AuthService } from "../../../../auth/auth.service";
import { UserSummary } from "../../../user.models";
import { UserRole } from "../../../user-role.models";
import {
  UserAccessOperation,
  UserAccessResponse,
} from "../../../user-access.models";
import { UserAccessService } from "../../../user-access.service";
import { createUserRoleReauthenticationForm } from "../../forms/user-role-reauthentication-form";
import { UserRoleReauthenticationFieldComponent } from "../../molecules/user-role-reauthentication-field/user-role-reauthentication-field.component";
import { UserAccessStatusBadgeComponent } from "../../atoms/user-access-status-badge/user-access-status-badge.component";

@Component({
  selector: "app-user-access-panel",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UserAccessStatusBadgeComponent,
    UserRoleReauthenticationFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <section
    aria-label="Acceso de la cuenta"
    class="mb-4 rounded-xl border border-[#e7e2e3] bg-white p-4"
  >
    <h3 class="text-sm font-semibold text-[#611232]">Acceso de la cuenta</h3>
    <p
      data-testid="access-target-id"
      class="mt-1 text-xs text-gray-600"
    >
      Cuenta seleccionada: #{{ user.id }} — {{ user.name }}
    </p>
    <div class="mt-2">
      <app-user-access-status-badge [status]="user.access_status" />
      <p
        data-testid="access-state-explanation"
        class="mt-2 text-xs leading-5 text-gray-700"
      >
        {{ statusExplanation() }}
      </p>
    </div>
    <p class="mt-2 text-xs text-gray-600">
      El reingreso de una Persona no habilita su cuenta automáticamente. Los
      roles se conservan y deben revisarse antes de habilitarla.
    </p>
    @if (rolesLoading) {
      <p
        data-testid="access-roles-loading"
        class="mt-2 text-xs text-gray-600"
      >
        Consultando roles antes de permitir la habilitación.
      </p>
    } @else if (rolesError) {
      <p
        data-testid="access-roles-error"
        class="mt-2 text-xs text-red-700"
      >
        No se pueden verificar los roles. Reintenta su consulta antes de habilitar.
      </p>
    }
    @if (!user.id_persona) {
      <p class="mt-2 text-sm text-amber-800">
        Vincula primero la cuenta con una Persona activa.
      </p>
    }
    @if (notice()) {
      <p role="status" class="mt-3 text-sm text-green-800">{{ notice() }}</p>
    }
    @if (error()) {
      <p role="alert" class="mt-3 text-sm text-red-800">{{ error() }}</p>
    }
    @if (httpDiagnostic()) {
      <p
        data-testid="access-http-diagnostic"
        class="mt-1 text-xs text-red-700"
      >
        {{ httpDiagnostic() }}
      </p>
    }
    @if (!operation()) {
      @if (canEnable()) {
        <button
          type="button"
          data-testid="enable-user-access"
          (click)="open('enable')"
          class="siga-focus mt-3 rounded-lg bg-[#611232] px-4 py-2 text-sm text-white"
        >
          Habilitar cuenta
        </button>
      }
      @if (canDisable()) {
        <button
          type="button"
          data-testid="disable-user-access"
          (click)="open('disable')"
          class="siga-focus mt-3 rounded-lg border border-[#611232] px-4 py-2 text-sm text-[#611232]"
        >
          Deshabilitar cuenta
        </button>
      }
    } @else {
      <form (submit)="$event.preventDefault(); confirm()" class="mt-3" [attr.aria-busy]="processing()">
        @if (processing()) {
          <p
            role="status"
            data-testid="access-request-stage"
            class="mb-3 text-xs font-medium text-[#611232]"
          >
            {{
              requestStage() === "reauthentication"
                ? "Verificando contraseña administrativa con Laravel..."
                : "Enviando cambio de estado y esperando confirmación..."
            }}
          </p>
        }
        <p class="text-sm font-medium">
          {{
            operation() === "enable"
              ? "Confirmar habilitación"
              : "Confirmar deshabilitación"
          }}
        </p>
        <p class="mt-2 text-xs text-gray-600">
          Esta operación cerrará las sesiones existentes de la cuenta afectada.
          La protección del último administrador se valida al confirmar.
        </p>
        <p
          data-testid="access-transition-explanation"
          class="mt-2 text-xs leading-5 text-gray-700"
        >
          {{
            operation() === "enable"
              ? "Se autorizará el acceso con los roles actualmente asignados. Se requerirá iniciar una sesión nueva."
              : "Se retirará el acceso, se revocarán las sesiones y se conservarán los roles y el historial."
          }}
        </p>
        @if (operation() === "enable") {
          <div
            data-testid="access-assigned-roles"
            class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
          >
            <p class="text-xs font-semibold text-[#611232]">
              Roles asignados que deben revisarse
            </p>

            @if (rolesLoading) {
              <p class="mt-2 text-xs">
                Consultando roles...
              </p>
            } @else if (rolesError) {
              <p class="mt-2 text-xs text-red-700">
                No se han podido verificar los roles.
              </p>
            } @else if (roles.length === 0) {
              <p class="mt-2 text-xs text-amber-900">
                Esta cuenta no tiene roles asignados.
                Puede habilitarse, pero no recibirá permisos funcionales por roles.
              </p>
            } @else {
              <ul class="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-700">
                @for (role of roles; track role.id) {
                  <li>{{ role.name }} ({{ role.code }})</li>
                }
              </ul>
            }

            <p class="mt-2 text-xs text-gray-600">
              Los permisos efectivos se resuelven exclusivamente en Laravel.
            </p>
          </div>
          <label class="mt-3 flex gap-2 text-sm"
            ><input
              type="checkbox"
              data-testid="access-roles-reviewed"
              [formControl]="reviewed"
            />He revisado los roles asignados y confirmo que corresponden a esta cuenta.</label
          >
        }
        <app-user-role-reauthentication-field
          [form]="form"
          purpose="cambiar el acceso de la cuenta"
          passwordId="user-access-password"
        />
        <div class="mt-3 flex gap-3">
          <button
            type="submit"
            data-testid="confirm-user-access"
            [disabled]="
              processing() ||
              form.invalid ||
              (operation() === 'enable' && (!reviewed.value || !canEnable()))
            "
            class="siga-focus rounded-lg bg-[#611232] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {{ processing() ? "Procesando..." : "Confirmar" }}
          </button>
          <button
            type="button"
            (click)="cancel()"
            [disabled]="processing()"
            class="siga-focus rounded-lg border px-4 py-2 text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    }
  </section>`,
})
export class UserAccessPanelComponent implements OnChanges {
  @Input({ required: true }) user!: UserSummary;
  @Input() roles: readonly UserRole[] = [];
  @Input() rolesLoading = false;
  @Input() rolesError: string | null = null;
  @Input() blocked = false;
  @Output() readonly changed = new EventEmitter<UserAccessResponse>();
  @Output() readonly busy = new EventEmitter<boolean>();
  private readonly router = inject(Router);
  private readonly context = inject(AuthContextService);
  private readonly auth = inject(AuthService);
  private readonly access = inject(UserAccessService);
  private readonly destroy = inject(DestroyRef);
  private pending: Subscription | null = null;
  private selectedId: number | null = null;
  readonly operation = signal<UserAccessOperation | null>(null);
  readonly processing = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly requestStage = signal<"idle" | "reauthentication" | "transition">("idle");
  readonly httpDiagnostic = signal<string | null>(null);
  readonly form = createUserRoleReauthenticationForm();
  readonly reviewed = new FormControl(false, { nonNullable: true });

  ngOnChanges(): void {
    if (this.selectedId !== this.user.id) {
      this.pending?.unsubscribe();
      this.processing.set(false);
      this.busy.emit(false);
      this.reset();
      this.notice.set(null);
      this.selectedId = this.user.id;
    }
  }
  statusExplanation(): string {
    switch (this.user.access_status) {
      case "PENDIENTE":
        return "La cuenta está registrada, pero aún no se ha autorizado su acceso. Puede habilitarse tras revisar sus roles o deshabilitarse.";

      case "HABILITADO":
        return "La cuenta puede iniciar sesión mientras su Persona esté ACTIVA. Las operaciones disponibles dependen de sus permisos efectivos.";

      case "DESHABILITADO":
        return "El acceso está retirado. Para habilitar nuevamente, deben revisarse los roles y confirmar la autorización.";

      default:
        return "No hay un estado administrativo verificable. No se puede cambiar el acceso.";
    }
  }
  canEnable(): boolean {
    return (
      !this.blocked &&
      !this.rolesLoading &&
      this.rolesError === null &&
      !!this.user.id_persona &&
      (this.user.access_status === "PENDIENTE" ||
        this.user.access_status === "DESHABILITADO") &&
      this.context.hasPermission("usuarios.habilitar")
    );
  }
  canDisable(): boolean {
    return (
      !this.blocked &&
      (this.user.access_status === "HABILITADO" ||
        this.user.access_status === "PENDIENTE") &&
      this.context.hasPermission("usuarios.deshabilitar")
    );
  }
  open(operation: UserAccessOperation): void {
    if (
      this.processing() ||
      !(operation === "enable" ? this.canEnable() : this.canDisable())
    )
      return;
    this.reset();
    this.notice.set(null);
    this.operation.set(operation);
  }
  cancel(): void {
    if (!this.processing()) this.reset();
  }
  private reset(): void {
    this.form.reset();
    this.reviewed.reset();
    this.operation.set(null);
    this.error.set(null);
    this.requestStage.set("idle");
    this.httpDiagnostic.set(null);
  }
  confirm(): void {
    const operation = this.operation();
    if (
      !operation ||
      this.processing() ||
      this.form.invalid ||
      (operation === "enable" && (!this.reviewed.value || !this.canEnable())) ||
      (operation === "disable" && !this.canDisable())
    )
      return;
    const id = this.user.id;
    const password = this.form.controls.password.value;
    this.form.reset();
    this.processing.set(true);
    this.busy.emit(true);
    this.error.set(null);
    this.httpDiagnostic.set(null);
    this.requestStage.set("reauthentication");
    let stage: "reauthentication" | "transition" = "reauthentication";
    this.pending = this.auth
      .reauthenticate(password)
      .pipe(
        switchMap(() => {
          stage = "transition";
          this.requestStage.set("transition");
          return this.access.change(id, operation);
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe({
        next: (response) => {
          this.processing.set(false);
          this.busy.emit(false);
          this.reset();
          this.notice.set(
            operation === "enable"
              ? "Cuenta habilitada. Se requiere iniciar una sesión nueva."
              : "Cuenta deshabilitada. Sus sesiones fueron revocadas.",
          );
          this.changed.emit(response);
          if (this.context.user()?.id === id) {
            this.context.clear();
            void this.router.navigateByUrl("/acceso?estado=sesion-finalizada", {
              replaceUrl: true,
            });
          }
        },
        error: (error: unknown) => {
          this.processing.set(false);
          this.busy.emit(false);
          this.form.reset();
          this.requestStage.set("idle");

          const etapa = stage === "reauthentication"
            ? "Reautenticación"
            : "Cambio de estado";

          this.httpDiagnostic.set(
            error instanceof HttpErrorResponse
              ? `${etapa} | HTTP ${error.status} | cuenta #${id}`
              : `${etapa} | respuesta no verificable | cuenta #${id}`,
          );
          if (error instanceof HttpErrorResponse) {
            if (error.status === 0) {
              this.error.set(
                "No se pudo conectar con Laravel. Verifica el servidor y el proxy."
              );
              return;
            }
            if (error.status === 419) {
              this.error.set(
                "La sesión o el token CSRF caducaron. Inicia sesión nuevamente antes de reintentar."
              );
              return;
            }
            if (
              error.status === 409 &&
              error.error?.code === "LAST_ENABLED_ADMIN"
            ) {
              this.error.set(
                "No se puede dejar SIGA sin otro administrador habilitado.",
              );
              return;
            }
            if (error.status === 401) {
              this.error.set("La sesión finalizó. Inicia sesión nuevamente.");
              return;
            }
            if (error.status === 403) {
              this.error.set(
                "No tienes autorización para cambiar el acceso de esta cuenta.",
              );
              return;
            }
            if (error.status === 423) {
              this.error.set(
                "La reautenticación caducó. Confirma nuevamente tu contraseña.",
              );
              return;
            }
            if (error.status === 429) {
              this.error.set(
                "Se alcanzó el límite de intentos. Espera antes de volver a confirmar.",
              );
              return;
            }
            if (error.status === 422) {
              this.error.set(
                stage === "reauthentication"
                  ? "No fue posible confirmar la contraseña."
                  : "Se requiere una Persona activa y la revisión de sus autorizaciones.",
              );
              return;
            }
          }
          this.error.set(
            stage === "transition"
              ? "No se pudo confirmar el resultado. Consulta de nuevo el listado antes de repetir la operación."
              : "No fue posible completar la reautenticación.",
          );
        },
      });
  }
}
