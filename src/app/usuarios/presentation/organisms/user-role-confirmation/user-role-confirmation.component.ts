import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";

import { UserRole } from "../../../user-role.models";
import { UserSummary } from "../../../user.models";
import {
  UserRoleReauthenticationForm,
} from "../../forms/user-role-reauthentication-form";
import {
  UserRoleReauthenticationFieldComponent,
} from "../../molecules/user-role-reauthentication-field/user-role-reauthentication-field.component";

export type UserRoleOperation = "assign" | "remove";

@Component({
  selector: "app-user-role-confirmation",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UserRoleReauthenticationFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-label="Confirmación de modificación de roles"
      class="rounded-lg border border-[#e4d9dd] bg-white p-3 sm:p-4"
    >
      <h3 class="text-sm font-semibold text-[#611232]">
        {{ operation === "assign" ? "Asignar rol" : "Retirar rol" }}
      </h3>

      <p class="mt-2 text-xs text-[#555555]">
        Usuario:
        <strong data-testid="role-confirmation-user">
          {{ user.name }}
        </strong>
      </p>

      <p class="mt-1 text-xs text-[#555555]">
        Rol:
        <strong data-testid="role-confirmation-role">
          {{ role.name }}
        </strong>
      </p>

      @if (role.code === "ROL_ADMIN_SISTEMA") {
        <p
          role="alert"
          data-testid="protected-admin-role"
          class="mt-4 text-sm font-semibold text-[#9b2247]"
        >
          El rol de administrador del sistema está protegido
          y no puede modificarse mediante esta operación.
        </p>
      } @else {
        <form
          [formGroup]="form"
          (ngSubmit)="confirmOperation()"
          novalidate
        >
          <app-user-role-reauthentication-field
            [form]="form"
            [passwordError]="passwordError"
          />

          @if (operationError) {
            <p
              role="alert"
              data-testid="role-operation-error"
              class="mt-4 text-sm font-semibold text-[#9b2247]"
            >
              {{ operationError }}
            </p>
          }

          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              data-testid="confirm-user-role-operation"
              [disabled]="processing || form.invalid"
              class="siga-focus rounded-lg bg-[#611232] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              @if (processing) {
                Procesando...
              } @else {
                {{ operation === "assign" ? "Confirmar asignación" : "Confirmar retiro" }}
              }
            </button>

            <button
              type="button"
              data-testid="cancel-user-role-operation"
              [disabled]="processing"
              class="siga-focus rounded-lg border border-[#98989a]/40 px-3 py-2 text-xs font-semibold text-[#611232] disabled:opacity-50"
              (click)="cancel.emit()"
            >
              Cancelar
            </button>
          </div>
        </form>
      }
    </section>
  `,
})
export class UserRoleConfirmationComponent {
  @Input({ required: true })
  user!: UserSummary;

  @Input({ required: true })
  role!: UserRole;

  @Input({ required: true })
  operation!: UserRoleOperation;

  @Input({ required: true })
  form!: UserRoleReauthenticationForm;

  @Input()
  processing = false;

  @Input()
  passwordError: string | null = null;

  @Input()
  operationError: string | null = null;

  @Output()
  readonly confirm = new EventEmitter<void>();

  @Output()
  readonly cancel = new EventEmitter<void>();

  confirmOperation(): void {
    if (
      this.processing ||
      this.form.invalid ||
      this.role.code === "ROL_ADMIN_SISTEMA"
    ) {
      return;
    }

    this.confirm.emit();
  }
}