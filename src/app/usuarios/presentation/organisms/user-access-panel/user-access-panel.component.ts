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
    <div class="mt-2">
      <app-user-access-status-badge [status]="user.access_status" />
    </div>
    <p class="mt-2 text-xs text-gray-600">
      El reingreso de una Persona no habilita su cuenta automáticamente. Los
      roles se conservan y deben revisarse antes de habilitarla.
    </p>
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
      <form (ngSubmit)="confirm()" class="mt-3" [attr.aria-busy]="processing()">
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
        @if (operation() === "enable") {
          <label class="mt-3 flex gap-2 text-sm"
            ><input
              type="checkbox"
              data-testid="access-roles-reviewed"
              [formControl]="reviewed"
            />He revisado los roles y autorizaciones de esta cuenta.</label
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
              (operation() === 'enable' && !reviewed.value)
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
  canEnable(): boolean {
    return (
      !this.blocked &&
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
    let stage: "reauthentication" | "transition" = "reauthentication";
    this.pending = this.auth
      .reauthenticate(password)
      .pipe(
        switchMap(() => {
          stage = "transition";
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
          if (error instanceof HttpErrorResponse) {
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
