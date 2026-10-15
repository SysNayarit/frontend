import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

export type PersonaEditForm = FormGroup<{
  nombres: FormControl<string>;
  apellido_paterno: FormControl<string>;
  apellido_materno: FormControl<string>;
  fecha_nacimiento: FormControl<string>;
  sexo: FormControl<string>;
  estado_civil: FormControl<string>;
}>;

@Component({
  selector: 'app-persona-edit-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
  template: `
    <form
      data-testid="persona-edit-form"
      [formGroup]="form"
      (ngSubmit)="submitRequested.emit()"
      class="mt-8 rounded-xl border border-[#a57f2c]/30 bg-[#f7f7f5] p-6"
    >
      <p
        class="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b2247]"
      >
        Actualización de Persona
      </p>

      <h3
        class="siga-title mt-2 text-2xl font-bold text-[#611232]"
      >
        Editar persona
      </h3>

      <p
        class="mt-3 text-sm leading-6 text-[#555555]"
      >
        Modifica los datos actuales de la persona seleccionada.
      </p>

      <div
        class="mt-6 grid gap-5 md:grid-cols-3"
      >
        <div>
          <label
            for="persona-edit-nombres"
            class="block text-sm font-semibold text-[#611232]"
          >
            Nombres
          </label>

          <input
            id="persona-edit-nombres"
            data-testid="persona-edit-nombres"
            formControlName="nombres"
            type="text"
            autocomplete="given-name"
            class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
          />
        </div>

        <div>
          <label
            for="persona-edit-apellido-paterno"
            class="block text-sm font-semibold text-[#611232]"
          >
            Apellido paterno
          </label>

          <input
            id="persona-edit-apellido-paterno"
            data-testid="persona-edit-apellido-paterno"
            formControlName="apellido_paterno"
            type="text"
            autocomplete="family-name"
            class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
          />
        </div>

        <div>
          <label
            for="persona-edit-apellido-materno"
            class="block text-sm font-semibold text-[#611232]"
          >
            Apellido materno
          </label>

          <input
            id="persona-edit-apellido-materno"
            data-testid="persona-edit-apellido-materno"
            formControlName="apellido_materno"
            type="text"
            class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
          />
        </div>
      </div>

      <div
        class="mt-6 grid gap-5 md:grid-cols-3"
      >
        <div>
          <label
            for="persona-edit-fecha-nacimiento"
            class="block text-sm font-semibold text-[#611232]"
          >
            Fecha de nacimiento
          </label>

          <input
            id="persona-edit-fecha-nacimiento"
            data-testid="persona-edit-fecha-nacimiento"
            formControlName="fecha_nacimiento"
            type="date"
            class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
          />
        </div>

        <div>
          <label
            for="persona-edit-sexo"
            class="block text-sm font-semibold text-[#611232]"
          >
            Sexo
          </label>

          <select
            id="persona-edit-sexo"
            data-testid="persona-edit-sexo"
            formControlName="sexo"
            class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
          >
            <option value="">
              No especificado
            </option>
            <option value="MASCULINO">
              Masculino
            </option>
            <option value="FEMENINO">
              Femenino
            </option>
          </select>
        </div>

        <div>
          <label
            for="persona-edit-estado-civil"
            class="block text-sm font-semibold text-[#611232]"
          >
            Estado civil
          </label>

          <select
            id="persona-edit-estado-civil"
            data-testid="persona-edit-estado-civil"
            formControlName="estado_civil"
            class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
          >
            <option value="">
              No especificado
            </option>
            <option value="SOLTERO">
              Soltero
            </option>
            <option value="CASADO">
              Casado
            </option>
          </select>
        </div>
      </div>

      @if (errorMessage) {
        <div
          data-testid="persona-edit-error"
          class="mt-6 rounded-lg border border-[#9b2247]/30 bg-white p-4 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ errorMessage }}
        </div>
      }

      @if (nombresError) {
        <p
          data-testid="persona-edit-nombres-error"
          class="mt-4 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ nombresError }}
        </p>
      }

      @if (apellidosError) {
        <p
          data-testid="persona-edit-apellidos-error"
          class="mt-2 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ apellidosError }}
        </p>
      }

      @if (fechaNacimientoError) {
        <p
          data-testid="persona-edit-fecha-nacimiento-error"
          class="mt-2 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ fechaNacimientoError }}
        </p>
      }

      <div
        class="mt-6 flex flex-wrap gap-3"
      >
        <button
          type="submit"
          data-testid="persona-edit-submit"
          class="siga-focus rounded-lg bg-[#611232] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9b2247]"
        >
          Guardar cambios
        </button>

        <button
          type="button"
          data-testid="persona-edit-cancel"
          (click)="cancelRequested.emit()"
          class="siga-focus rounded-lg border border-[#611232]/30 bg-white px-5 py-3 text-sm font-semibold text-[#611232] transition hover:bg-[#611232]/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  `,
})
export class PersonaEditFormComponent {
  @Input({ required: true })
  form!: PersonaEditForm;

  @Input()
  errorMessage: string | null = null;

  @Input()
  nombresError: string | null = null;

  @Input()
  apellidosError: string | null = null;

  @Input()
  fechaNacimientoError: string | null = null;

  @Output()
  readonly submitRequested =
    new EventEmitter<void>();

  @Output()
  readonly cancelRequested =
    new EventEmitter<void>();
}