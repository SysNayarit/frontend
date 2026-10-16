import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import {
  PersonDetail,
  PersonListItem,
  PersonListMeta,
} from '../../../person.models';
import { ModuleNavigationComponent } from '../../molecules/module-navigation/module-navigation.component';
import {
  PersonaEditForm,
  PersonaEditFormComponent,
} from '../../organisms/persona-edit-form/persona-edit-form.component';
import {
  PersonaRegisterForm,
  PersonaRegisterFormComponent,
} from '../../organisms/persona-register-form/persona-register-form.component';
import {
  PersonaReinstateForm,
  PersonaReinstateFormComponent,
} from '../../organisms/persona-reinstate-form/persona-reinstate-form.component';
import { PersonaDetailComponent } from '../../organisms/persona-detail/persona-detail.component';
import { PersonasListComponent } from '../../organisms/personas-list/personas-list.component';
import {
  PersonaWithdrawForm,
  PersonaWithdrawFormComponent,
} from '../../organisms/persona-withdraw-form/persona-withdraw-form.component';

@Component({
  selector: 'app-personas-management-template',
  standalone: true,
  imports: [
    ModuleNavigationComponent,
    PersonaDetailComponent,
    PersonaEditFormComponent,
    PersonaRegisterFormComponent,
    PersonaReinstateFormComponent,
    PersonaWithdrawFormComponent,
    PersonasListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section
        class="border-b border-[#a57f2c]/20 bg-[#611232] text-white shadow-md"
      >
        <div
          class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        >
          <p
            class="text-xs font-semibold uppercase tracking-[0.18em] text-[#e6d194]"
          >
            Módulo Personas
          </p>

          <h1
            class="siga-title mt-1 text-3xl font-bold tracking-tight"
          >
            Personas
          </h1>

          <p
            class="mt-3 text-sm text-white/75"
          >
            Núcleo de identidad de SIGA
          </p>
        </div>
      </section>

      <app-module-navigation />

      <div
        class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <section
          class="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
        >
          <div
            class="h-1.5 bg-gradient-to-r from-[#611232] via-[#9b2247] to-[#a57f2c]"
            aria-hidden="true"
          ></div>

          <div class="p-6 sm:p-8">
            <p
              class="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b2247]"
            >
              Personas
            </p>

            <h2
              class="siga-title mt-2 text-3xl font-bold text-[#611232]"
            >
              Gestión de personas
            </h2>

            <p
              class="mt-4 max-w-3xl leading-7 text-[#555555]"
            >
              Consulta de personas registradas en la Módulo Personas SIGA.
            </p>

            @if (canCreatePerson) {
              <button
                type="button"
                data-testid="persona-register"
                (click)="openRegisterRequested.emit()"
                class="siga-focus mt-6 rounded-lg bg-[#611232] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9b2247]"
              >
                Registrar persona
              </button>
            }

            @if (registerSuccessMessage) {
              <div
                data-testid="persona-register-success"
                class="mt-6 rounded-lg border border-[#1e5b4f]/30 bg-white p-4 text-sm font-semibold text-[#1e5b4f]"
                role="status"
              >
                {{ registerSuccessMessage }}
              </div>
            }

            @if (editSuccessMessage) {
              <div
                data-testid="persona-edit-success"
                class="mt-6 rounded-lg border border-[#1e5b4f]/30 bg-white p-4 text-sm font-semibold text-[#1e5b4f]"
                role="status"
              >
                {{ editSuccessMessage }}
              </div>
            }

            @if (withdrawSuccessMessage) {
              <div
                data-testid="persona-withdraw-success"
                class="mt-6 rounded-lg border border-[#1e5b4f]/30 bg-white p-4 text-sm font-semibold text-[#1e5b4f]"
                role="status"
              >
                {{ withdrawSuccessMessage }}
              </div>
            }

            @if (reinstateSuccessMessage) {
              <div
                data-testid="persona-reinstate-success"
                class="mt-6 rounded-lg border border-[#1e5b4f]/30 bg-white p-4 text-sm font-semibold text-[#1e5b4f]"
                role="status"
              >
                {{ reinstateSuccessMessage }}
              </div>
            }

            @if (withdrawFormOpen) {
              @if (withdrawingPerson; as personToWithdraw) {
                <app-persona-withdraw-form
                  [form]="withdrawForm"
                  [person]="personToWithdraw"
                  [passwordError]="withdrawPasswordError"
                  [errorMessage]="withdrawErrorMessage"
                  (submitRequested)="submitWithdrawRequested.emit()"
                  (cancelRequested)="cancelWithdrawRequested.emit()"
                />
              }
            }

            @if (reinstateFormOpen) {
              @if (reinstatingPerson; as personToReinstate) {
                <app-persona-reinstate-form
                  [form]="reinstateForm"
                  [person]="personToReinstate"
                  [passwordError]="reinstatePasswordError"
                  [errorMessage]="reinstateErrorMessage"
                  (submitRequested)="submitReinstateRequested.emit()"
                  (cancelRequested)="cancelReinstateRequested.emit()"
                />
              }
            }

            @if (registerFormOpen) {
              <app-persona-register-form
                [form]="registerForm"
                [errorMessage]="registerErrorMessage"
                [fechaNacimientoError]="registerFechaNacimientoError"
                [nombresError]="registerNombresError"
                [apellidosError]="registerApellidosError"
                (submitRequested)="submitRegisterRequested.emit()"
                (cancelRequested)="cancelRegisterRequested.emit()"
              />
            }

            @if (editFormOpen) {
              <app-persona-edit-form
                [form]="editForm"
                [errorMessage]="editErrorMessage"
                [nombresError]="editNombresError"
                [apellidosError]="editApellidosError"
                [fechaNacimientoError]="editFechaNacimientoError"
                (submitRequested)="submitEditRequested.emit()"
                (cancelRequested)="cancelEditRequested.emit()"
              />
            }

            <app-persona-detail
              [person]="selectedPerson"
              [errorMessage]="detailErrorMessage"
              (closeRequested)="closeDetailRequested.emit()"
            />

            <app-personas-list
              [persons]="persons"
              [meta]="meta"
              [errorMessage]="errorMessage"
              [canUpdate]="canUpdatePerson"
              [canWithdraw]="canWithdrawPerson"
              [canReinstate]="canReinstatePerson"
              (viewDetailRequested)="viewDetailRequested.emit($event)"
              (editRequested)="editRequested.emit($event)"
              (withdrawRequested)="withdrawRequested.emit($event)"
              (reinstateRequested)="reinstateRequested.emit($event)"
              (previousPageRequested)="previousPageRequested.emit()"
              (nextPageRequested)="nextPageRequested.emit()"
            />
          </div>
        </section>
      </div>

  `,
})
export class PersonasManagementTemplateComponent {
  @Input()
  canCreatePerson = false;

  @Input()
  registerSuccessMessage: string | null = null;

  @Input()
  editSuccessMessage: string | null = null;

  @Input()
  withdrawSuccessMessage: string | null = null;

  @Input()
  reinstateSuccessMessage: string | null = null;

  @Input()
  withdrawFormOpen = false;

  @Input()
  withdrawingPerson: PersonListItem | null = null;

  @Input({ required: true })
  withdrawForm!: PersonaWithdrawForm;

  @Input()
  withdrawPasswordError: string | null = null;

  @Input()
  withdrawErrorMessage: string | null = null;

  @Input()
  reinstateFormOpen = false;

  @Input()
  reinstatingPerson: PersonListItem | null = null;

  @Input({ required: true })
  reinstateForm!: PersonaReinstateForm;

  @Input()
  reinstatePasswordError: string | null = null;

  @Input()
  reinstateErrorMessage: string | null = null;

  @Input()
  registerFormOpen = false;

  @Input({ required: true })
  registerForm!: PersonaRegisterForm;

  @Input()
  registerErrorMessage: string | null = null;

  @Input()
  registerFechaNacimientoError: string | null = null;

  @Input()
  registerNombresError: string | null = null;

  @Input()
  registerApellidosError: string | null = null;

  @Input()
  editFormOpen = false;

  @Input({ required: true })
  editForm!: PersonaEditForm;

  @Input()
  editErrorMessage: string | null = null;

  @Input()
  editNombresError: string | null = null;

  @Input()
  editApellidosError: string | null = null;

  @Input()
  editFechaNacimientoError: string | null = null;

  @Input()
  selectedPerson: PersonDetail | null = null;

  @Input()
  detailErrorMessage: string | null = null;

  @Input()
  persons: PersonListItem[] = [];

  @Input()
  meta: PersonListMeta | null = null;

  @Input()
  errorMessage: string | null = null;

  @Input()
  canUpdatePerson = false;

  @Input()
  canWithdrawPerson = false;

  @Input()
  canReinstatePerson = false;

  @Output()
  readonly openRegisterRequested =
    new EventEmitter<void>();

  @Output()
  readonly submitRegisterRequested =
    new EventEmitter<void>();

  @Output()
  readonly cancelRegisterRequested =
    new EventEmitter<void>();

  @Output()
  readonly submitEditRequested =
    new EventEmitter<void>();

  @Output()
  readonly cancelEditRequested =
    new EventEmitter<void>();

  @Output()
  readonly submitWithdrawRequested =
    new EventEmitter<void>();

  @Output()
  readonly cancelWithdrawRequested =
    new EventEmitter<void>();

  @Output()
  readonly submitReinstateRequested =
    new EventEmitter<void>();

  @Output()
  readonly cancelReinstateRequested =
    new EventEmitter<void>();

  @Output()
  readonly closeDetailRequested =
    new EventEmitter<void>();

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
}