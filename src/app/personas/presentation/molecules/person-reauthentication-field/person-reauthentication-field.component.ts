import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";

import { PersonReauthenticationForm } from "../../forms/person-reauthentication-form";

export type PersonReauthenticationMode = "withdraw" | "reinstate";

@Component({
  selector: "app-person-reauthentication-field",
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="mt-3 text-sm leading-6 text-[#555555]">
      Por seguridad, vuelve a introducir tu contraseña antes de continuar.
    </p>

    <div class="mt-6 max-w-md">
      <label
        [for]="passwordId"
        class="block text-sm font-semibold text-[#611232]"
      >
        Contraseña
      </label>

      <input
        [id]="passwordId"
        [attr.data-testid]="passwordId"
        [formControl]="form.controls.password"
        type="password"
        autocomplete="current-password"
        class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
      />

      @if (passwordError) {
        <p
          [attr.data-testid]="passwordErrorTestId"
          class="mt-2 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ passwordError }}
        </p>
      }
    </div>
  `,
})
export class PersonReauthenticationFieldComponent {
  @Input({ required: true })
  form!: PersonReauthenticationForm;

  @Input({ required: true })
  mode!: PersonReauthenticationMode;

  @Input()
  passwordError: string | null = null;

  get passwordId(): string {
    return this.mode === "withdraw"
      ? "persona-withdraw-password"
      : "persona-reinstate-password";
  }

  get passwordErrorTestId(): string {
    return this.passwordId + "-error";
  }
}
