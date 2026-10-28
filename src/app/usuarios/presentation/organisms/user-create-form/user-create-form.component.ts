import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AvailablePerson } from "../../../user.models";

export interface UserCreateFormValue {
  email: string;
  password: string;
  password_confirmation: string;
  administratorPassword: string;
}

@Component({
  selector: "app-user-create-form",
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-xl border border-[#e7e2e3] bg-white p-4">
      <h2 class="text-base font-semibold text-[#611232]">
        Crear cuenta de usuario
      </h2>

      <p class="mt-2 text-sm text-gray-700">
        {{ person().nombres }}
        {{ person().apellido_paterno }}
        {{ person().apellido_materno }}
      </p>
      <p class="text-xs text-gray-500">
        Expediente: {{ person().num_expediente }}
      </p>

      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="mt-4 grid gap-3"
      >
        <fieldset [disabled]="processing()" class="grid gap-3">
        <label class="grid gap-1 text-xs font-medium text-gray-700">
          Correo electrónico
          <input
            type="email"
            formControlName="email"
            autocomplete="off"
            class="siga-focus rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label class="grid gap-1 text-xs font-medium text-gray-700">
          Contraseña inicial
          <input
            type="password"
            formControlName="password"
            autocomplete="new-password"
            class="siga-focus rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <span class="font-normal text-gray-500">
            Mínimo 15 caracteres.
          </span>
        </label>

        <label class="grid gap-1 text-xs font-medium text-gray-700">
          Confirmar contraseña
          <input
            type="password"
            formControlName="password_confirmation"
            autocomplete="new-password"
            class="siga-focus rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        @if (
          form.controls.password_confirmation.touched &&
          form.controls.password.value !==
            form.controls.password_confirmation.value
        ) {
          <p role="alert" class="text-xs text-red-700">
            Las contraseñas no coinciden.
          </p>
        }

        <label class="grid gap-1 text-xs font-medium text-gray-700">
          Contraseña del administrador
          <input
            type="password"
            formControlName="administratorPassword"
            autocomplete="off"
            class="siga-focus rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        </fieldset>
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="siga-focus rounded-lg border px-4 py-2 text-sm"
            [disabled]="processing()"
            (click)="cancel.emit()"
          >
            Cancelar
          </button>

          <button
            type="submit"
            data-testid="confirm-create-user"
            [disabled]="processing() || !canSubmit()"
            class="siga-focus rounded-lg bg-[#611232] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Crear usuario
          </button>
        </div>
      </form>
    </section>
  `,
})
export class UserCreateFormComponent {
  readonly person = input.required<AvailablePerson>();
  readonly processing = input(false);
  readonly confirm = output<UserCreateFormValue>();
  readonly cancel = output<void>();

  readonly form = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(15)],
    }),
    password_confirmation: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    administratorPassword: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  canSubmit(): boolean {
    const value = this.form.getRawValue();

    return (
      this.form.valid &&
      value.password === value.password_confirmation
    );
  }

  submit(): void {
    if (this.processing()) return;
    this.form.markAllAsTouched();

    if (!this.canSubmit()) {
      return;
    }

    this.confirm.emit(this.form.getRawValue());
  }
}