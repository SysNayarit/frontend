import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";

import { PersonForm } from "../../forms/person-form";

@Component({
  selector: "app-person-form-fields",
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-6 grid gap-5 md:grid-cols-3">
      <div>
        <label
          [for]="fieldId('nombres')"
          class="block text-sm font-semibold text-[#611232]"
        >
          Nombres
        </label>

        <input
          [id]="fieldId('nombres')"
          [attr.data-testid]="fieldTestId('nombres')"
          [formControl]="form.controls.nombres"
          type="text"
          autocomplete="given-name"
          class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
        />
      </div>

      <div>
        <label
          [for]="fieldId('apellido-paterno')"
          class="block text-sm font-semibold text-[#611232]"
        >
          Apellido paterno
        </label>

        <input
          [id]="fieldId('apellido-paterno')"
          [attr.data-testid]="fieldTestId('apellido-paterno')"
          [formControl]="form.controls.apellido_paterno"
          type="text"
          autocomplete="family-name"
          class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
        />
      </div>

      <div>
        <label
          [for]="fieldId('apellido-materno')"
          class="block text-sm font-semibold text-[#611232]"
        >
          Apellido materno
        </label>

        <input
          [id]="fieldId('apellido-materno')"
          [attr.data-testid]="fieldTestId('apellido-materno')"
          [formControl]="form.controls.apellido_materno"
          type="text"
          class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
        />
      </div>
    </div>

    <div class="mt-6 grid gap-5 md:grid-cols-3">
      <div>
        <label
          [for]="fieldId('fecha-nacimiento')"
          class="block text-sm font-semibold text-[#611232]"
        >
          Fecha de nacimiento
        </label>

        <input
          [id]="fieldId('fecha-nacimiento')"
          [attr.data-testid]="fieldTestId('fecha-nacimiento')"
          [formControl]="form.controls.fecha_nacimiento"
          type="date"
          class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
        />
      </div>

      <div>
        <label
          [for]="fieldId('sexo')"
          class="block text-sm font-semibold text-[#611232]"
        >
          Sexo
        </label>

        <select
          [id]="fieldId('sexo')"
          [attr.data-testid]="fieldTestId('sexo')"
          [formControl]="form.controls.sexo"
          class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
        >
          <option value="">No especificado</option>
          <option value="MASCULINO">Masculino</option>
          <option value="FEMENINO">Femenino</option>
        </select>
      </div>

      <div>
        <label
          [for]="fieldId('estado-civil')"
          class="block text-sm font-semibold text-[#611232]"
        >
          Estado civil
        </label>

        <select
          [id]="fieldId('estado-civil')"
          [attr.data-testid]="fieldTestId('estado-civil')"
          [formControl]="form.controls.estado_civil"
          class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
        >
          <option value="">No especificado</option>
          <option value="SOLTERO">Soltero</option>
          <option value="CASADO">Casado</option>
        </select>
      </div>
    </div>

    @if (nombresError) {
      <p
        [attr.data-testid]="errorTestId('nombres')"
        class="mt-4 text-sm font-semibold text-[#9b2247]"
        role="alert"
      >
        {{ nombresError }}
      </p>
    }

    @if (apellidosError) {
      <p
        [attr.data-testid]="errorTestId('apellidos')"
        class="mt-2 text-sm font-semibold text-[#9b2247]"
        role="alert"
      >
        {{ apellidosError }}
      </p>
    }

    @if (fechaNacimientoError) {
      <p
        [attr.data-testid]="errorTestId('fecha-nacimiento')"
        class="mt-2 text-sm font-semibold text-[#9b2247]"
        role="alert"
      >
        {{ fechaNacimientoError }}
      </p>
    }
  `,
})
export class PersonFormFieldsComponent {
  @Input({ required: true })
  form!: PersonForm;

  @Input()
  mode: "register" | "edit" = "register";

  @Input()
  nombresError: string | null = null;

  @Input()
  apellidosError: string | null = null;

  @Input()
  fechaNacimientoError: string | null = null;

  fieldId(field: string): string {
    return this.mode === "edit" ? "persona-edit-" + field : "persona-" + field;
  }

  fieldTestId(field: string): string {
    return this.fieldId(field);
  }

  errorTestId(field: string): string {
    return this.mode === "edit"
      ? "persona-edit-" + field + "-error"
      : "persona-" + field + "-error";
  }
}
