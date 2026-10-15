import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { PersonDetail } from '../../../person.models';
import { PersonStatusBadgeComponent } from '../../atoms/person-status-badge/person-status-badge.component';
import { formatPersonDateLong } from '../../utils/person-date';
import { personDisplayName } from '../../utils/person-display-name';

@Component({
  selector: 'app-persona-detail',
  standalone: true,
  imports: [
    PersonStatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
  template: `
    @if (errorMessage) {
      <div
        data-testid="persona-detail-error"
        class="mt-8 rounded-xl border border-[#9b2247]/30 bg-[#9b2247]/5 px-6 py-8 text-center"
        role="alert"
      >
        <p
          class="siga-title text-xl font-bold text-[#611232]"
        >
          No fue posible cargar el detalle de la persona
        </p>

        <p
          class="mt-2 text-sm text-[#555555]"
        >
          El registro pudo haber cambiado o no estar disponible.
        </p>
      </div>
    } @else if (person) {
      <section
        data-testid="persona-detail"
        class="mt-8 rounded-xl border border-[#a57f2c]/30 bg-[#f7f7f5] p-6"
      >
        <div
          class="flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b2247]"
            >
              Detalle de Persona
            </p>

            <h3
              class="siga-title mt-2 text-2xl font-bold text-[#611232]"
            >
              {{ fullName(person) }}
            </h3>
          </div>

          <div
            class="flex flex-wrap items-center gap-3"
          >
            <app-person-status-badge
              [status]="person.estatus"
            />

            <button
              type="button"
              data-testid="persona-detail-close"
              (click)="closeRequested.emit()"
              class="siga-focus rounded-lg border border-[#611232]/30 bg-white px-4 py-2 text-sm font-semibold text-[#611232] transition hover:bg-[#611232]/5"
            >
              Cerrar
            </button>
          </div>
        </div>

        <dl
          class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <dt
              class="text-xs font-semibold uppercase tracking-wide text-[#555555]"
            >
              Expediente
            </dt>
            <dd
              class="mt-1 font-semibold text-[#161a1d]"
            >
              {{ person.num_expediente }}
            </dd>
          </div>

          <div>
            <dt
              class="text-xs font-semibold uppercase tracking-wide text-[#555555]"
            >
              Sexo
            </dt>
            <dd
              class="mt-1 text-[#161a1d]"
            >
              {{ person.sexo ?? 'No registrado' }}
            </dd>
          </div>

          <div>
            <dt
              class="text-xs font-semibold uppercase tracking-wide text-[#555555]"
            >
              Estado civil
            </dt>
            <dd
              class="mt-1 text-[#161a1d]"
            >
              {{ person.estado_civil ?? 'No registrado' }}
            </dd>
          </div>

          <div>
            <dt
              class="text-xs font-semibold uppercase tracking-wide text-[#555555]"
            >
              Fecha de nacimiento
            </dt>
            <dd
              class="mt-1 text-[#161a1d]"
            >
              {{ formatDate(person.fecha_nacimiento) ?? 'No registrada' }}
            </dd>
          </div>
        </dl>
      </section>
    }
  `,
})
export class PersonaDetailComponent {
  @Input()
  person: PersonDetail | null = null;

  @Input()
  errorMessage: string | null = null;

  @Output()
  readonly closeRequested =
    new EventEmitter<void>();

  readonly fullName = personDisplayName;

  readonly formatDate = formatPersonDateLong;
}