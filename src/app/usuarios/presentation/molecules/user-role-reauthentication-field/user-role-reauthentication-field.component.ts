import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";

import {
  UserRoleReauthenticationForm,
} from "../../forms/user-role-reauthentication-form";

@Component({
  selector: "app-user-role-reauthentication-field",
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-3 max-w-sm">
      <p class="text-xs leading-5 text-[#555555]">
        Por seguridad, confirma tu contraseña antes de {{ purpose }}.
      </p>

      <label
        [attr.for]="passwordId"
        class="mt-2 block text-xs font-semibold text-[#611232]"
      >
        Contraseña del administrador
      </label>

      <input
        [id]="passwordId"
        data-testid="user-role-reauthentication-password"
        type="password"
        autocomplete="current-password"
        [formControl]="form.controls.password"
        [attr.aria-invalid]="passwordError ? 'true' : null"
        [attr.aria-describedby]="passwordError ? 'user-role-password-error' : null"
        class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-3 py-2 text-sm text-[#161a1d]"
      />

      @if (passwordError) {
        <p
          id="user-role-password-error"
          data-testid="user-role-password-error"
          role="alert"
          class="mt-2 text-sm font-semibold text-[#9b2247]"
        >
          {{ passwordError }}
        </p>
      }
    </div>
  `,
})
export class UserRoleReauthenticationFieldComponent {
  @Input({ required: true })
  form!: UserRoleReauthenticationForm;

  @Input()
  passwordError: string | null = null;

  @Input() purpose = "modificar los roles del usuario";
  @Input() passwordId = "user-role-reauthentication-password";
}