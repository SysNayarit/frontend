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

export type PersonaRegisterForm = FormGroup<{
  nombres: FormControl<string>;
  apellido_paterno: FormControl<string>;
  apellido_materno: FormControl<string>;
  fecha_nacimiento: FormControl<string>;
  sexo: FormControl<string>;
  estado_civil: FormControl<string>;
}>;

@Component({
  selector: 'app-persona-register-form',
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
      data-testid="persona-register-form"
      [formGroup]="form"
      (ngSubmit)="submitRequested.emit()"
      class="mt-8 rounded-xl border border-[#a57f2c]/30 bg-[#f7f7f5] p-6"
    >
      <p
        class="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b2247]"
      >
        Alta de Persona
      </p>

      <h3
        class="siga-title mt-2 text-2xl font-bold text-[#611232]"
      >
        Registrar persona
      </h3>

      <p
        class="mt-3 text-sm leading-6 text-[#555555]"
      >
        Captura los datos requeridos para registrar una nueva persona en SIGA.
      </p>

      <div
        class="mt-6 grid gap-5 md:grid-cols-3"
      >
        <div>
          <label
            for="persona-nombres"
            class="block text-sm font-semibold text-[#611232]"
          >
            Nombres
          </label>

          <input
            id="persona-nombres"
            data-testid="persona-nombres"
            formControlName="nombres"
            type="text"
            autocomplete="given-name"
            class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
          />
        </div>

        <div>
          <label
            for="persona-apellido-paterno"
            class="block text-sm font-semibold text-[#611232]"
          >
            Apellido paterno
          </label>

          <input
            id="persona-apellido-paterno"
            data-testid="persona-apellido-paterno"
            formControlName="apellido_paterno"
            type="text"
            autocomplete="family-name"
            class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
          />
        </div>

        <div>
          <label
            for="persona-apellido-materno"
            class="block text-sm font-semibold text-[#611232]"
          >
            Apellido materno
          </label>

          <input
            id="persona-apellido-materno"
            data-testid="persona-apellido-materno"
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
            for="persona-fecha-nacimiento"
            class="block text-sm font-semibold text-[#611232]"
          >
            Fecha de nacimiento
          </label>

          <input
            id="persona-fecha-nacimiento"
            data-testid="persona-fecha-nacimiento"
            formControlName="fecha_nacimiento"
            type="date"
            class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
          />
        </div>

        <div>
          <label
            for="persona-sexo"
            class="block text-sm font-semibold text-[#611232]"
          >
            Sexo
          </label>

          <select
            id="persona-sexo"
            data-testid="persona-sexo"
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
            for="persona-estado-civil"
            class="block text-sm font-semibold text-[#611232]"
          >
            Estado civil
          </label>

          <select
            id="persona-estado-civil"
            data-testid="persona-estado-civil"
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
          data-testid="persona-register-error"
          class="mt-6 rounded-lg border border-[#9b2247]/30 bg-white p-4 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ errorMessage }}
        </div>
      }

      @if (fechaNacimientoError) {
        <p
          data-testid="persona-fecha-nacimiento-error"
          class="mt-4 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ fechaNacimientoError }}
        </p>
      }

      @if (nombresError) {
        <p
          data-testid="persona-nombres-error"
          class="mt-4 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ nombresError }}
        </p>
      }

      @if (apellidosError) {
        <p
          data-testid="persona-apellidos-error"
          class="mt-2 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ apellidosError }}
        </p>
      }

      <p
        class="mt-4 text-xs text-[#555555]"
      >
        Nombres es obligatorio. Debe capturarse al menos uno de los dos apellidos.
      </p>

      <div
        class="mt-6 flex flex-wrap gap-3"
      >
        <button
          type="submit"
          data-testid="persona-register-submit"
          class="siga-focus rounded-lg bg-[#611232] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9b2247]"
        >
          Guardar persona
        </button>

        <button
          type="button"
          data-testid="persona-register-cancel"
          (click)="cancelRequested.emit()"
          class="siga-focus rounded-lg border border-[#611232]/30 bg-white px-5 py-3 text-sm font-semibold text-[#611232] transition hover:bg-[#611232]/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  `,
})
export class PersonaRegisterFormComponent {
  @Input({ required: true })
  form!: PersonaRegisterForm;

  @Input()
  errorMessage: string | null = null;

  @Input()
  fechaNacimientoError: string | null = null;

  @Input()
  nombresError: string | null = null;

  @Input()
  apellidosError: string | null = null;

  @Output()
  readonly submitRequested =
    new EventEmitter<void>();

  @Output()
  readonly cancelRequested =
    new EventEmitter<void>();
}