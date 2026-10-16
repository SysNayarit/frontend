import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";

import { personDisplayName } from "../../../../shared/utils/person-display-name";
import { PersonListItem } from "../../../person.models";
import { PersonReauthenticationForm } from "../../forms/person-reauthentication-form";
import { PersonReauthenticationFieldComponent } from "../../molecules/person-reauthentication-field/person-reauthentication-field.component";

export type PersonaReinstateForm = PersonReauthenticationForm;

@Component({
  selector: "app-persona-reinstate-form",
  standalone: true,
  imports: [ReactiveFormsModule, PersonReauthenticationFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "contents",
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

      <h3 class="siga-title mt-2 text-2xl font-bold text-[#611232]">
        Reingresar Persona
      </h3>

      <p class="mt-3 text-sm leading-6 text-[#555555]">
        Confirma el reingreso de
        <strong>{{ fullName(person) }}</strong>
        con expediente
        <strong>{{ person.num_expediente }}</strong
        >.
      </p>

      <app-person-reauthentication-field
        [form]="form"
        mode="reinstate"
        [passwordError]="passwordError"
      />

      @if (errorMessage) {
        <p
          data-testid="persona-reinstate-error"
          class="mt-4 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ errorMessage }}
        </p>
      }

      <div class="mt-6 flex flex-wrap gap-3">
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
  readonly submitRequested = new EventEmitter<void>();

  @Output()
  readonly cancelRequested = new EventEmitter<void>();

  readonly fullName = personDisplayName;
}
