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
import { personDisplayName } from '../../../../shared/utils/person-display-name';

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
        <section
          data-testid="persona-registration-info"
          class="mt-6 border-t border-[#a57f2c]/25 pt-5"
          aria-label="Información de registro"
        >
          <h4 class="siga-title text-lg font-bold text-[#611232]">
            Información de registro
          </h4>

          @if (person.informacion_registro; as registro) {
            <dl class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-[#555555]">
                  Forma de registro
                </dt>
                <dd data-testid="registration-origin" class="mt-1 text-[#161a1d]">
                  @switch (registro.forma_registro) {
                    @case ('INDIVIDUAL') { Individual }
                    @case ('MASIVO') { Masivo }
                    @default { No determinado }
                  }
                </dd>
              </div>

              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-[#555555]">
                  Fecha de registro
                </dt>
                <dd data-testid="registration-date" class="mt-1 text-[#161a1d]">
                  {{ formatDate(registro.fecha_registro) ?? 'No registrada' }}
                </dd>
              </div>

              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-[#555555]">
                  Registrado por
                </dt>
                <dd data-testid="registration-user" class="mt-1 text-[#161a1d]">
                  {{ registro.registrado_por ?? 'No identificado' }}
                </dd>
              </div>

              @if (registro.forma_registro === 'MASIVO') {
                <div>
                  <dt class="text-xs font-semibold uppercase tracking-wide text-[#555555]">
                    Archivo de origen
                  </dt>
                  <dd data-testid="registration-file" class="mt-1 break-all text-[#161a1d]">
                    {{ registro.archivo_origen ?? 'No disponible' }}
                  </dd>
                </div>

                <div>
                  <dt class="text-xs font-semibold uppercase tracking-wide text-[#555555]">
                    Fila del archivo
                  </dt>
                  <dd data-testid="registration-row" class="mt-1 text-[#161a1d]">
                    {{ registro.fila_archivo ?? 'No disponible' }}
                  </dd>
                </div>

                <div>
                  <dt class="text-xs font-semibold uppercase tracking-wide text-[#555555]">
                    Identificador del lote
                  </dt>
                  <dd data-testid="registration-batch" class="mt-1 break-all text-sm text-[#161a1d]">
                    {{ registro.lote_uuid ?? 'No disponible' }}
                  </dd>
                </div>
              }
            </dl>

            @if (registro.forma_registro === 'NO_DETERMINADO') {
              <p data-testid="registration-unknown" class="mt-4 text-sm text-[#555555]">
                No existe evidencia suficiente para determinar cómo se registró esta persona.
              </p>
            }
          } @else {
            <p data-testid="registration-unavailable" class="mt-4 text-sm text-[#555555]">
              Información de registro no disponible.
            </p>
          }
        </section>
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