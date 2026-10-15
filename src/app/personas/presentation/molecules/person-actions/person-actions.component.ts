import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { PersonListItem } from '../../../person.models';

@Component({
  selector: 'app-person-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
  template: `
    <div
      class="flex flex-wrap gap-2"
    >
      <button
        type="button"
        data-testid="persona-view-detail"
        (click)="viewDetailRequested.emit(person.id_persona)"
        class="siga-focus rounded-lg border border-[#611232] px-3 py-2 text-sm font-semibold text-[#611232] transition hover:bg-[#611232] hover:text-white"
      >
        Ver detalle
      </button>

      @if (canUpdate) {
        <button
          type="button"
          data-testid="persona-edit"
          (click)="editRequested.emit(person.id_persona)"
          class="siga-focus rounded-lg border border-[#a57f2c] px-3 py-2 text-sm font-semibold text-[#611232] transition hover:bg-[#a57f2c]/10"
        >
          Editar
        </button>
      }

      @if (
        canWithdraw &&
        person.estatus !== 'BAJA'
      ) {
        <button
          type="button"
          data-testid="persona-withdraw"
          (click)="withdrawRequested.emit(person)"
          class="siga-focus rounded-lg border border-[#9b2247] px-3 py-2 text-sm font-semibold text-[#9b2247] transition hover:bg-[#9b2247] hover:text-white"
        >
          Dar de baja
        </button>
      }

      @if (
        canReinstate &&
        person.estatus === 'BAJA'
      ) {
        <button
          type="button"
          data-testid="persona-reinstate"
          (click)="reinstateRequested.emit(person)"
          class="siga-focus rounded-lg border border-[#1e5b4f] px-3 py-2 text-sm font-semibold text-[#1e5b4f] transition hover:bg-[#1e5b4f] hover:text-white"
        >
          Reingresar
        </button>
      }
    </div>
  `,
})
export class PersonActionsComponent {
  @Input({ required: true })
  person!: PersonListItem;

  @Input()
  canUpdate = false;

  @Input()
  canWithdraw = false;

  @Input()
  canReinstate = false;

  @Output()
  readonly viewDetailRequested =
    new EventEmitter<string>();

  @Output()
  readonly editRequested =
    new EventEmitter<string>();

  @Output()
  readonly withdrawRequested =
    new EventEmitter<PersonListItem>();

  @Output()
  readonly reinstateRequested =
    new EventEmitter<PersonListItem>();
}