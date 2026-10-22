import { NgTemplateOutlet } from '@angular/common';
import { TemplateRef } from '@angular/core';

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import {
  PersonListItem,
  PersonListMeta,
} from '../../../person.models';
import { PersonActionsComponent } from '../../molecules/person-actions/person-actions.component';
import { PersonasPaginationComponent } from '../../molecules/personas-pagination/personas-pagination.component';
import { personDisplayName } from '../../../../shared/utils/person-display-name';

@Component({
  selector: 'app-personas-list',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    PersonActionsComponent,
    PersonasPaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
  template: `
    @if (errorMessage) {
      <div
        data-testid="personas-error-state"
        class="mt-8 rounded-xl border border-[#9b2247]/30 bg-[#9b2247]/5 px-6 py-10 text-center"
        role="alert"
      >
        <p
          class="siga-title text-xl font-bold text-[#611232]"
        >
          No fue posible cargar el listado de personas
        </p>

        <p
          class="mt-2 text-sm text-[#555555]"
        >
          Intenta nuevamente cuando la conexión con SIGA esté disponible.
        </p>
      </div>
    } @else if (persons.length === 0) {
      <div
        data-testid="personas-empty-state"
        class="mt-8 rounded-xl border border-dashed border-[#98989a]/40 bg-[#f7f7f5] px-6 py-10 text-center"
      >
        <p
          class="siga-title text-xl font-bold text-[#611232]"
        >
          No hay personas registradas
        </p>

        <p
          class="mt-2 text-sm text-[#555555]"
        >
          Cuando existan registros autorizados, se mostrarán en este listado.
        </p>
      </div>
    } @else {
      <div
        class="mt-8 overflow-x-auto rounded-xl border border-[#98989a]/25"
        data-testid="person-list"
      >
        <table class="min-w-full border-collapse text-left">
          <thead class="bg-[#611232] text-white">
            <tr>
              <th
                scope="col"
                class="px-4 py-3 text-sm font-semibold"
              >
                Expediente
              </th>

              <th
                scope="col"
                class="px-4 py-3 text-sm font-semibold"
              >
                Nombre
              </th>

              <th
                scope="col"
                class="px-4 py-3 text-sm font-semibold"
              >
                Estatus
              </th>

              <th
                scope="col"
                class="px-4 py-3 text-sm font-semibold"
              >
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            @for (
              person of persons;
              track person.id_persona
            ) {
              <tr
                class="group border-t border-[#98989a]/20 transition-colors duration-200 motion-reduce:transition-none"
                [class.bg-[#DBEAFE]]="activePersonId === person.id_persona"
                [class.bg-[#FEE2E2]]="activePersonId !== person.id_persona && person.estatus === 'BAJA'"
                [class.hover:bg-[#EFF6FF]]="activePersonId !== person.id_persona && person.estatus !== 'BAJA'"
                [attr.aria-selected]="activePersonId === person.id_persona"
              >
                <td
                  class="whitespace-nowrap border-l-4 border-transparent px-4 py-3 text-sm font-medium text-[#611232] transition-colors duration-200 motion-reduce:transition-none"
                  [class.border-[#2563EB]]="activePersonId === person.id_persona"
                >
                  {{ person.num_expediente }}
                </td>

                <td
                  class="px-4 py-3 text-sm text-[#161a1d]"
                >
                  {{ fullName(person) }}
                </td>

                <td
                  class="whitespace-nowrap px-4 py-3 text-sm text-[#555555]"
                >
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    [class.bg-[#FEE2E2]]="person.estatus === 'BAJA'"
                    [class.text-[#991B1B]]="person.estatus === 'BAJA'"
                    [class.bg-[#E7F4ED]]="person.estatus !== 'BAJA'"
                    [class.text-[#1E5B4F]]="person.estatus !== 'BAJA'"
                  >
                    {{ person.estatus }}
                  </span>
                </td>

                <td
                  class="w-max whitespace-nowrap px-4 py-3"
                >
                  <app-person-actions
                    [person]="person"
                    [canUpdate]="canUpdate"
                    [canWithdraw]="canWithdraw"
                    [canReinstate]="canReinstate"
                    (viewDetailRequested)="viewDetailRequested.emit($event)"
                    (editRequested)="editRequested.emit($event)"
                    (withdrawRequested)="withdrawRequested.emit($event)"
                    (reinstateRequested)="reinstateRequested.emit($event)"
                  />
                </td>
              </tr>

              @if (
                expandedPersonId === person.id_persona &&
                contextPanelTemplate
              ) {
                <tr
                  data-testid="persona-expanded-row"
                  [attr.data-person-id]="person.id_persona"
                  class="border-t border-[#2563EB]/30 bg-[#DBEAFE] motion-safe:animate-[siga-row-appear_650ms_cubic-bezier(0.22,1,0.36,1)_both]"
                >
                  <td colspan="4" class="p-3 sm:p-5">
                    <section
                      data-testid="persona-context-panel"
                      [attr.aria-label]="'Información de ' + fullName(person)"
                      class="siga-panel-expansion min-w-0 rounded-xl border border-[#2563EB]/30 border-l-4 border-l-[#2563EB] bg-white p-4 shadow-sm sm:p-6"
                    >
                      <div
                        class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#98989a]/20 pb-4"
                      >
                        <div>
                          <p class="text-xs font-semibold text-[#555555]">
                            Persona seleccionada
                          </p>
                          <h3 class="mt-1 text-lg font-bold text-[#611232]">
                            {{ fullName(person) }}
                          </h3>
                          <p class="text-sm text-[#555555]">
                            Expediente: {{ person.num_expediente }}
                          </p>
                        </div>
                      </div>

                      <ng-container
                        [ngTemplateOutlet]="contextPanelTemplate"
                      />
                    </section>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    }

    @if (meta) {
      <app-personas-pagination
        [meta]="meta"
        (previousRequested)="previousPageRequested.emit()"
        (nextRequested)="nextPageRequested.emit()"
      />
    }
  `,
})
export class PersonasListComponent {
  @Input()
  activePersonId: string | null = null;

  @Input()
  contextPanelTemplate: TemplateRef<unknown> | null = null;

  @Input()
  expandedPersonId: string | null = null;

  @Input()
  persons: PersonListItem[] = [];

  @Input()
  meta: PersonListMeta | null = null;

  @Input()
  errorMessage: string | null = null;

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

  @Output()
  readonly previousPageRequested =
    new EventEmitter<void>();

  @Output()
  readonly nextPageRequested =
    new EventEmitter<void>();

  readonly fullName = personDisplayName;
}