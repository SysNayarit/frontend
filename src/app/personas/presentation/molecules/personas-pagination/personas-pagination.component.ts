import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { PersonListMeta } from '../../../person.models';

@Component({
  selector: 'app-personas-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mt-4 flex flex-wrap items-center justify-between gap-4"
    >
      <p
        class="text-sm text-[#555555]"
      >
        Total de personas:
        <strong>{{ meta.total }}</strong>
      </p>

      <div
        class="flex items-center gap-3"
      >
        <button
          type="button"
          data-testid="personas-previous-page"
          (click)="previousRequested.emit()"
          [disabled]="meta.current_page <= 1"
          class="siga-focus rounded-lg border border-[#611232] px-4 py-2 text-sm font-semibold text-[#611232] transition hover:bg-[#611232] hover:text-white disabled:cursor-not-allowed disabled:border-[#98989a]/40 disabled:text-[#98989a] disabled:hover:bg-transparent"
        >
          Anterior
        </button>

        <span
          class="text-sm text-[#555555]"
        >
          Página
          <strong>{{ meta.current_page }}</strong>
          de
          <strong>{{ meta.last_page }}</strong>
        </span>

        <button
          type="button"
          data-testid="personas-next-page"
          (click)="nextRequested.emit()"
          [disabled]="meta.current_page >= meta.last_page"
          class="siga-focus rounded-lg border border-[#611232] px-4 py-2 text-sm font-semibold text-[#611232] transition hover:bg-[#611232] hover:text-white disabled:cursor-not-allowed disabled:border-[#98989a]/40 disabled:text-[#98989a] disabled:hover:bg-transparent"
        >
          Siguiente
        </button>
      </div>
    </div>
  `,
})
export class PersonasPaginationComponent {
  @Input({ required: true })
  meta!: PersonListMeta;

  @Output()
  readonly previousRequested =
    new EventEmitter<void>();

  @Output()
  readonly nextRequested =
    new EventEmitter<void>();
}