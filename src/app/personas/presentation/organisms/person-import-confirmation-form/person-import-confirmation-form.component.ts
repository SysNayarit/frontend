import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";

import { PersonImportBatch } from "../../../person-import.models";
import { PersonReauthenticationForm } from "../../forms/person-reauthentication-form";
import { PersonReauthenticationFieldComponent } from "../../molecules/person-reauthentication-field/person-reauthentication-field.component";

@Component({
  selector: "app-person-import-confirmation-form",
  standalone: true,
  imports: [ReactiveFormsModule, PersonReauthenticationFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "contents",
  },
  template: `
    <form
      data-testid="person-import-confirmation-form"
      [formGroup]="form"
      (ngSubmit)="requestConfirmation()"
      class="mt-8 rounded-xl border border-[#1e5b4f]/30 bg-[#f7f7f5] p-6"
    >
      <p
        class="text-xs font-semibold uppercase tracking-[0.18em] text-[#1e5b4f]"
      >
        Operación sensible
      </p>

      <h3 class="siga-title mt-2 text-2xl font-bold text-[#611232]">
        Confirmar importación de Personas
      </h3>

      <p class="mt-3 text-sm leading-6 text-[#555555]">
        Revisa el resumen antes de confirmar la importación.
        La confirmación enviará el lote a la cola de procesamiento.
      </p>

      <dl class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="font-semibold text-[#611232]">Archivo</dt>
          <dd class="mt-1 break-all text-[#161a1d]">
            {{ batch.original_filename }}
          </dd>
        </div>

        <div>
          <dt class="font-semibold text-[#611232]">Estado</dt>
          <dd class="mt-1 text-[#161a1d]">{{ batch.status }}</dd>
        </div>

        <div>
          <dt class="font-semibold text-[#611232]">Filas válidas</dt>
          <dd class="mt-1 text-[#161a1d]">{{ batch.valid_rows }}</dd>
        </div>

        <div>
          <dt class="font-semibold text-[#611232]">Filas inválidas</dt>
          <dd class="mt-1 text-[#161a1d]">{{ batch.invalid_rows }}</dd>
        </div>
      </dl>

      <app-person-reauthentication-field
        [form]="form"
        mode="import"
        [passwordError]="passwordError"
      />

      @if (errorMessage) {
        <p
          data-testid="person-import-confirmation-error"
          class="mt-4 text-sm font-semibold text-[#9b2247]"
          role="alert"
        >
          {{ errorMessage }}
        </p>
      }

      <div class="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          data-testid="person-import-confirm-submit"
          [disabled]="!canConfirm"
          class="siga-focus rounded-lg bg-[#1e5b4f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17473e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ busy ? "Confirmando..." : "Confirmar importación" }}
        </button>

        <button
          type="button"
          data-testid="person-import-confirm-cancel"
          [disabled]="busy"
          (click)="cancelRequested.emit()"
          class="siga-focus rounded-lg border border-[#611232]/30 bg-white px-5 py-3 text-sm font-semibold text-[#611232] transition hover:bg-[#611232]/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  `,
})
export class PersonImportConfirmationFormComponent {
  @Input({ required: true })
  form!: PersonReauthenticationForm;

  @Input({ required: true })
  batch!: PersonImportBatch;

  @Input()
  busy = false;

  @Input()
  passwordError: string | null = null;

  @Input()
  errorMessage: string | null = null;

  @Output()
  readonly submitRequested = new EventEmitter<void>();

  @Output()
  readonly cancelRequested = new EventEmitter<void>();

  get canConfirm(): boolean {
    return (
      !this.busy &&
      this.batch.status === "READY" &&
      this.batch.valid_rows > 0
    );
  }

  requestConfirmation(): void {
    if (!this.canConfirm) {
      return;
    }

    this.submitRequested.emit();
  }
}
