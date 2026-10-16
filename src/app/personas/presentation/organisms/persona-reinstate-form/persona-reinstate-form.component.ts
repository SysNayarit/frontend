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

import { PersonListItem } from '../../../person.models';
import { personDisplayName } from '../../../../shared/utils/person-display-name';

export type PersonaReinstateForm = FormGroup<{
  password: FormControl<string>;
}>;

@Component({
  selector: 'app-persona-reinstate-form',
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
      data-testid="persona-reinstate-form"
      [formGroup]="form"
      (ngSubmit)="submitRequested.emit()"
      class="mt-8 rounded-xl border border-[#1e5b4f]/30 bg-[#f7f7f5] p-6"
    >
      <p
        class="text-xs font-semibold uppercase tracking-[0.18em] text-[#1e5b4f]"
      >
        Operación sensible
      </p>

      <h3
        class="siga-title mt-2 text-2xl font-bold text-[#611232]"
      >
        Reingresar Persona
      </h3>

      <p
        class="mt-3 text-sm leading-6 text-[#555555]"
      >
        Confirma el reingreso de
        <strong>
          {{ fullName(person) }}
        </strong>
        con expediente
        <strong>
          {{ person.num_expediente }}
        </strong>.
      </p>

      <p
        class="mt-3 text-sm leading-6 text-[#555555]"
      >
        Por seguridad, vuelve a introducir tu contraseña antes de continuar.
      </p>

      <div class="mt-6 max-w-md">
        <label
          for="persona-reinstate-password"
          class="block text-sm font-semibold text-[#611232]"
        >
          Contraseña
        </label>

        <input
          id="persona-reinstate-password"
          data-testid="persona-reinstate-password"
          formControlName="password"
          type="password"
          autocomplete="current-password"
          class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
        />

        @if (passwordError) {
          <p
            data-testid="persona-reinstate-password-error"
            class="mt-2 text-sm font-semibold text-[#9b2247]"
            role="alert"
          >
            {{ passwordError }}
          </p>
        }
      </div>

      @if (errorMessage) {
        <p
          data-testid="persona-reinstate-error"
          class="mt-4 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ errorMessage }}
        </p>
      }

      <div
        class="mt-6 flex flex-wrap gap-3"
      >
        <button
          type="submit"
          data-testid="persona-reinstate-submit"
          class="siga-focus rounded-lg bg-[#1e5b4f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17473e]"
        >
          Confirmar reingreso
        </button>

        <button
          type="button"
          data-testid="persona-reinstate-cancel"
          (click)="cancelRequested.emit()"
          class="siga-focus rounded-lg border border-[#611232]/30 bg-white px-5 py-3 text-sm font-semibold text-[#611232] transition hover:bg-[#611232]/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  `,
})
export class PersonaReinstateFormComponent {
  @Input({ required: true })
  form!: PersonaReinstateForm;

  @Input({ required: true })
  person!: PersonListItem;

  @Input()
  passwordError: string | null = null;

  @Input()
  errorMessage: string | null = null;

  @Output()
  readonly submitRequested =
    new EventEmitter<void>();

  @Output()
  readonly cancelRequested =
    new EventEmitter<void>();

  readonly fullName = personDisplayName;
}