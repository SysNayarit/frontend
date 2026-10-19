import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { AuthContextService } from '../../../../auth/auth-context.service';
import {
  PersonDetail,
  PersonListItem,
  PersonListMeta,
} from '../../../person.models';
import {
  PersonLifecycleError,
  PersonLifecycleService,
} from '../../../person-lifecycle.service';
import { PersonService } from '../../../person.service';
import { createPersonReauthenticationForm } from '../../forms/person-reauthentication-form';
import {
  PERSON_BIRTH_DATE_VALIDATION_TIME_ZONE,
  createPersonForm,
  normalizePersonForm,
  personCreateRequest,
  personFormHasErrors,
  personFormValueFromDetail,
  personUpdateRequest,
  validatePersonForm,
} from '../../forms/person-form';
import { PersonaDetailComponent } from '../../organisms/persona-detail/persona-detail.component';
import { PersonaEditFormComponent } from '../../organisms/persona-edit-form/persona-edit-form.component';
import { PersonaRegisterFormComponent } from '../../organisms/persona-register-form/persona-register-form.component';
import { PersonaReinstateFormComponent } from '../../organisms/persona-reinstate-form/persona-reinstate-form.component';
import { PersonasListComponent } from '../../organisms/personas-list/personas-list.component';
import { PersonaWithdrawFormComponent } from '../../organisms/persona-withdraw-form/persona-withdraw-form.component';
import { PersonasManagementTemplateComponent } from '../../templates/personas-management-template/personas-management-template.component';



type PersonasManagementFlow =
  | 'register'
  | 'edit'
  | 'withdraw'
  | 'reinstate';

@Component({
  selector: 'app-personas-page',
  standalone: true,
  imports: [
    PersonasManagementTemplateComponent,
    PersonaDetailComponent,
    PersonaEditFormComponent,
    PersonaRegisterFormComponent,
    PersonaReinstateFormComponent,
    PersonaWithdrawFormComponent,
    PersonasListComponent,
  ],
  templateUrl: './personas-page.component.html',
})
export class PersonasPageComponent implements OnInit {
  private readonly personLifecycle = inject(
    PersonLifecycleService,
  );
  private readonly authContext = inject(AuthContextService);

  private readonly personService = inject(
    PersonService,
  );

  private listRequestVersion = 0;

  private detailRequestVersion = 0;

  private editRequestVersion = 0;

  readonly persons = signal<PersonListItem[]>(
    [],
  );

  readonly meta = signal<PersonListMeta | null>(
    null,
  );

  readonly errorMessage = signal<string | null>(
    null,
  );

  readonly selectedPerson = signal<PersonDetail | null>(
    null,
  );

  readonly detailErrorMessage = signal<string | null>(
    null,
  );

  readonly canCreatePerson = signal(false);

  readonly canUpdatePerson = signal(false);

  readonly canWithdrawPerson = signal(false);

  readonly canReinstatePerson = signal(false);

  readonly activeFlow = signal<PersonasManagementFlow | null>(
    null,
  );

  readonly registerFormOpen = computed(
    () => this.activeFlow() === 'register',
  );

  readonly editFormOpen = computed(
    () => this.activeFlow() === 'edit',
  );

  readonly editingPersonId = signal<string | null>(
    null,
  );

  readonly withdrawFormOpen = computed(
    () => this.activeFlow() === 'withdraw',
  );

  readonly withdrawingPerson = signal<PersonListItem | null>(
    null,
  );

  readonly withdrawPasswordError = signal<string | null>(
    null,
  );

  readonly withdrawErrorMessage = signal<string | null>(
    null,
  );

  readonly withdrawSuccessMessage = signal<string | null>(
    null,
  );

  readonly reinstateFormOpen = computed(
    () => this.activeFlow() === 'reinstate',
  );

  readonly reinstatingPerson = signal<PersonListItem | null>(
    null,
  );

  readonly reinstatePasswordError = signal<string | null>(
    null,
  );

  readonly reinstateErrorMessage = signal<string | null>(
    null,
  );

  readonly reinstateSuccessMessage = signal<string | null>(
    null,
  );

  readonly birthDateValidationTimeZone =
    PERSON_BIRTH_DATE_VALIDATION_TIME_ZONE;

  readonly registerForm = createPersonForm();

  readonly withdrawForm = createPersonReauthenticationForm();

  readonly reinstateForm = createPersonReauthenticationForm();

  readonly editForm = createPersonForm();
  readonly editSuccessMessage = signal<string | null>(
    null,
  );

  readonly editErrorMessage = signal<string | null>(
    null,
  );
  readonly editNombresError = signal<string | null>(
    null,
  );

  readonly editApellidosError = signal<string | null>(
    null,
  );

  readonly editFechaNacimientoError = signal<string | null>(
    null,
  );

  readonly registerNombresError = signal<string | null>(
    null,
  );

  readonly registerApellidosError = signal<string | null>(
    null,
  );

  readonly registerFechaNacimientoError = signal<string | null>(
    null,
  );

  readonly registerSuccessMessage = signal<string | null>(
    null,
  );

  readonly registerErrorMessage = signal<string | null>(
    null,
  );

  ngOnInit(): void {
    this.loadPermissions();
    this.loadPage(1);
  }

  private loadPermissions(): void {
    this.authContext.ensureCurrent().subscribe({
      next: (user) => {
        this.canCreatePerson.set(
          user.permissions.includes(
            'personas.crear',
          ),
        );

        this.canUpdatePerson.set(
          user.permissions.includes(
            'personas.actualizar',
          ),
        );

        this.canWithdrawPerson.set(
          user.permissions.includes(
            'personas.baja',
          ),
        );

        this.canReinstatePerson.set(
          user.permissions.includes(
            'personas.reingreso',
          ),
        );
      },
      error: () => {
        this.canCreatePerson.set(false);
        this.canUpdatePerson.set(false);
        this.canWithdrawPerson.set(false);
        this.canReinstatePerson.set(false);
      },
    });
  }

  loadPage(
    page: number,
  ): void {
    const requestVersion =
      ++this.listRequestVersion;

    this.errorMessage.set(null);

    this.personService
      .list(page)
      .subscribe({
        next: (response) => {
          if (
            requestVersion !==
            this.listRequestVersion
          ) {
            return;
          }

          this.persons.set(response.data);
          this.meta.set(response.meta);
        },
        error: () => {
          if (
            requestVersion !==
            this.listRequestVersion
          ) {
            return;
          }

          this.errorMessage.set(
            'No fue posible cargar el listado de personas',
          );
        },
      });
  }

  closeDetail(): void {
    this.detailRequestVersion += 1;

    this.selectedPerson.set(null);
    this.detailErrorMessage.set(null);
  }

  viewDetail(
    idPersona: string,
  ): void {
    const requestVersion =
      ++this.detailRequestVersion;

    this.selectedPerson.set(null);
    this.detailErrorMessage.set(null);

    this.personService
      .find(idPersona)
      .subscribe({
        next: (person) => {
          if (
            requestVersion !==
            this.detailRequestVersion
          ) {
            return;
          }

          this.selectedPerson.set(person);
        },
        error: () => {
          if (
            requestVersion !==
            this.detailRequestVersion
          ) {
            return;
          }

          this.selectedPerson.set(null);

          this.detailErrorMessage.set(
            'No fue posible cargar el detalle de la persona',
          );
        },
      });
  }

  openEditForm(
    idPersona: string,
  ): void {
    this.closeActiveFlow();

    const requestVersion =
      ++this.editRequestVersion;

    this.editSuccessMessage.set(null);
    this.editErrorMessage.set(null);
    this.editingPersonId.set(null);

    this.personService
      .find(idPersona)
      .subscribe({
        next: (person) => {
          if (
            requestVersion !==
            this.editRequestVersion
          ) {
            return;
          }
          this.editingPersonId.set(
            person.id_persona,
          );

          this.editForm.setValue(
            personFormValueFromDetail(person),
          );

          this.activeFlow.set('edit');
        },
        error: () => {
          if (
            requestVersion !==
            this.editRequestVersion
          ) {
            return;
          }
          this.editingPersonId.set(null);
        },
      });
  }
  cancelEditForm(): void {
    this.editForm.reset();

    this.editNombresError.set(null);
    this.editApellidosError.set(null);
    this.editFechaNacimientoError.set(null);
    this.editErrorMessage.set(null);

    this.activeFlow.set(null);
    this.editingPersonId.set(null);
  }
  submitEditForm(): void {
    const idPersona = this.editingPersonId();

    if (idPersona === null) {
      return;
    }

    this.editErrorMessage.set(null);

    const values = normalizePersonForm(
      this.editForm,
    );

    const errors = validatePersonForm(
      values,
      'edit',
    );

    this.editNombresError.set(
      errors.nombres,
    );

    this.editApellidosError.set(
      errors.apellidos,
    );

    this.editFechaNacimientoError.set(
      errors.fechaNacimiento,
    );

    if (personFormHasErrors(errors)) {
      return;
    }

    const payload = personUpdateRequest(
      values,
    );
    this.personService
      .update(
        idPersona,
        payload,
      )
      .subscribe({
        next: () => {
          const currentPage =
            this.meta()?.current_page ?? 1;

          this.editForm.reset();

          this.editNombresError.set(null);
          this.editApellidosError.set(null);
          this.editFechaNacimientoError.set(null);

          this.activeFlow.set(null);
          this.editingPersonId.set(null);

          this.editSuccessMessage.set(
            'Persona actualizada correctamente',
          );

          this.loadPage(currentPage);
        },
        error: (error: unknown) => {
          const response = error as {
            status?: number;
            error?: {
              errors?: Record<
                string,
                string[]
              >;
            };
          };

          const nombresErrors =
            response.error?.errors?.[
              'nombres'
            ];

          const apellidoPaternoErrors =
            response.error?.errors?.[
              'apellido_paterno'
            ];

          const apellidoMaternoErrors =
            response.error?.errors?.[
              'apellido_materno'
            ];

          const fechaNacimientoErrors =
            response.error?.errors?.[
              'fecha_nacimiento'
            ];

          if (
            response.status === 422 &&
            nombresErrors?.length
          ) {
            this.editNombresError.set(
              nombresErrors[0] ??
                'Los nombres no son válidos.',
            );

            this.editErrorMessage.set(null);

            return;
          }

          if (
            response.status === 422 &&
            (
              apellidoPaternoErrors?.length ||
              apellidoMaternoErrors?.length
            )
          ) {
            this.editApellidosError.set(
              apellidoPaternoErrors?.[0] ??
                apellidoMaternoErrors?.[0] ??
                'Los apellidos no son válidos.',
            );

            this.editErrorMessage.set(null);

            return;
          }

          if (
            response.status === 422 &&
            fechaNacimientoErrors?.length
          ) {
            this.editFechaNacimientoError.set(
              fechaNacimientoErrors[0] ??
                'La fecha de nacimiento no es válida.',
            );

            this.editErrorMessage.set(null);

            return;
          }

          this.editErrorMessage.set(
            'No fue posible actualizar la persona.',
          );
        },
      });
  }
  openWithdrawForm(
    person: PersonListItem,
  ): void {
    this.closeActiveFlow();

    this.withdrawForm.reset();
    this.withdrawPasswordError.set(null);
    this.withdrawErrorMessage.set(null);
    this.withdrawSuccessMessage.set(null);
    this.withdrawingPerson.set(person);

    this.activeFlow.set('withdraw');
  }
  submitWithdrawForm(): void {
    const person = this.withdrawingPerson();

    if (person === null) {
      return;
    }

    this.withdrawPasswordError.set(null);
    this.withdrawErrorMessage.set(null);

    const password =
      this.withdrawForm.controls.password.value;

    if (password === '') {
      this.withdrawPasswordError.set(
        'La contraseña es obligatoria.',
      );

      return;
    }

    this.personLifecycle
      .withdraw(
        person.id_persona,
        password,
      )
      .subscribe({
        next: (withdrawnPerson) => {
          const currentPage =
            this.meta()?.current_page ?? 1;

          const selectedPerson =
            this.selectedPerson();

          if (
            selectedPerson?.id_persona ===
            withdrawnPerson.id_persona
          ) {
            this.selectedPerson.set(
              withdrawnPerson,
            );
          }

          this.withdrawForm.reset();
          this.withdrawPasswordError.set(null);
          this.withdrawErrorMessage.set(null);
          this.withdrawingPerson.set(null);
          this.activeFlow.set(null);

          this.withdrawSuccessMessage.set(
            'Persona dada de baja correctamente',
          );

          this.loadPage(currentPage);
        },
        error: (error: unknown) => {
          if (
            error instanceof PersonLifecycleError &&
            error.stage === 'reauthentication'
          ) {
            this.withdrawPasswordError.set(
              this.reauthenticationPasswordMessage(
                error,
              ),
            );

            return;
          }

          const response =
            this.lifecycleErrorSource(error) as {
              status?: number;
            };

          this.withdrawForm.controls.password.reset();

          if (response.status === 423) {
            this.withdrawErrorMessage.set(
              'Se requiere una reautenticación reciente.',
            );

            return;
          }

          this.withdrawErrorMessage.set(
            'No fue posible dar de baja a la persona.',
          );
        },
      });
  }
  cancelWithdrawForm(): void {
    this.withdrawForm.reset();
    this.withdrawPasswordError.set(null);
    this.withdrawErrorMessage.set(null);
    this.withdrawingPerson.set(null);
    this.activeFlow.set(null);
  }
  openReinstateForm(
    person: PersonListItem,
  ): void {
    this.closeActiveFlow();

    this.reinstateForm.reset();
    this.reinstatePasswordError.set(null);
    this.reinstateErrorMessage.set(null);
    this.reinstateSuccessMessage.set(null);
    this.reinstatingPerson.set(person);

    this.activeFlow.set('reinstate');
  }
  submitReinstateForm(): void {
    const person = this.reinstatingPerson();

    if (person === null) {
      return;
    }

    this.reinstatePasswordError.set(null);
    this.reinstateErrorMessage.set(null);

    const password =
      this.reinstateForm.controls.password.value;

    if (password === '') {
      this.reinstatePasswordError.set(
        'La contraseña es obligatoria.',
      );

      return;
    }

    this.personLifecycle
      .reinstate(
        person.id_persona,
        password,
      )
      .subscribe({
        next: (reinstatedPerson) => {
          const currentPage =
            this.meta()?.current_page ?? 1;

          const selectedPerson =
            this.selectedPerson();

          if (
            selectedPerson?.id_persona ===
            reinstatedPerson.id_persona
          ) {
            this.selectedPerson.set(
              reinstatedPerson,
            );
          }

          this.reinstateForm.reset();
          this.reinstatePasswordError.set(null);
          this.reinstateErrorMessage.set(null);
          this.reinstatingPerson.set(null);
          this.activeFlow.set(null);

          this.reinstateSuccessMessage.set(
            'Persona reingresada correctamente',
          );

          this.loadPage(currentPage);
        },
        error: (error: unknown) => {
          if (
            error instanceof PersonLifecycleError &&
            error.stage === 'reauthentication'
          ) {
            this.reinstatePasswordError.set(
              this.reauthenticationPasswordMessage(
                error,
              ),
            );

            return;
          }

          const response =
            this.lifecycleErrorSource(error) as {
              status?: number;
            };

          this.reinstateForm.controls.password.reset();

          if (response.status === 423) {
            this.reinstateErrorMessage.set(
              'Se requiere una reautenticación reciente.',
            );

            return;
          }

          this.reinstateErrorMessage.set(
            'No fue posible reingresar a la persona.',
          );
        },
      });
  }
  cancelReinstateForm(): void {
    this.reinstateForm.reset();
    this.reinstatePasswordError.set(null);
    this.reinstateErrorMessage.set(null);
    this.reinstatingPerson.set(null);
    this.activeFlow.set(null);
  }
  openRegisterForm(): void {
    this.closeActiveFlow();

    this.registerSuccessMessage.set(null);
    this.registerErrorMessage.set(null);
    this.activeFlow.set('register');
  }

  cancelRegisterForm(): void {
    this.registerForm.reset();

    this.registerNombresError.set(null);
    this.registerApellidosError.set(null);
    this.registerFechaNacimientoError.set(null);
    this.registerErrorMessage.set(null);

    this.activeFlow.set(null);
  }

  submitRegisterForm(): void {
    this.registerErrorMessage.set(null);

    const values = normalizePersonForm(
      this.registerForm,
    );

    const errors = validatePersonForm(
      values,
      'register',
    );

    this.registerNombresError.set(
      errors.nombres,
    );

    this.registerApellidosError.set(
      errors.apellidos,
    );

    this.registerFechaNacimientoError.set(
      errors.fechaNacimiento,
    );

    if (personFormHasErrors(errors)) {
      return;
    }
    this.personService
      .create(
        personCreateRequest(values),
      )
      .subscribe({
        next: () => {
          this.registerForm.reset();

          this.registerNombresError.set(null);
          this.registerApellidosError.set(null);

          this.activeFlow.set(null);

          this.registerSuccessMessage.set(
            'Persona registrada correctamente',
          );

          this.loadPage(1);
        },
        error: (error: unknown) => {
          const response = error as {
            status?: number;
            error?: {
              errors?: Record<
                string,
                string[]
              >;
            };
          };

          const nombresErrors =
            response.error?.errors?.[
              'nombres'
            ];

          const apellidoPaternoErrors =
            response.error?.errors?.[
              'apellido_paterno'
            ];

          const apellidoMaternoErrors =
            response.error?.errors?.[
              'apellido_materno'
            ];

          const fechaNacimientoErrors =
            response.error?.errors?.[
              'fecha_nacimiento'
            ];

          if (
            response.status === 422 &&
            nombresErrors?.length
          ) {
            this.registerNombresError.set(
              nombresErrors[0] ??
                'Los nombres no son válidos.',
            );

            return;
          }

          if (
            response.status === 422 &&
            (
              apellidoPaternoErrors?.length ||
              apellidoMaternoErrors?.length
            )
          ) {
            this.registerApellidosError.set(
              apellidoPaternoErrors?.[0] ??
                apellidoMaternoErrors?.[0] ??
                'Los apellidos no son válidos.',
            );

            return;
          }

          if (
            response.status === 422 &&
            fechaNacimientoErrors?.length
          ) {
            this.registerFechaNacimientoError.set(
              fechaNacimientoErrors[0] ??
                'La fecha de nacimiento no es válida.',
            );

            return;
          }

          this.registerErrorMessage.set(
            'No fue posible registrar la persona.',
          );
        },
      });
  }

  private closeActiveFlow(): void {
    this.editRequestVersion += 1;

    switch (this.activeFlow()) {
      case 'register':
        this.cancelRegisterForm();
        return;
      case 'edit':
        this.cancelEditForm();
        return;
      case 'withdraw':
        this.cancelWithdrawForm();
        return;
      case 'reinstate':
        this.cancelReinstateForm();
        return;
      default:
        return;
    }
  }

  private lifecycleErrorSource(
    error: unknown,
  ): unknown {
    return error instanceof PersonLifecycleError
      ? error.originalError
      : error;
  }

  private reauthenticationPasswordMessage(
    error: unknown,
  ): string {
    const response =
      this.lifecycleErrorSource(error) as {
        status?: number;
        error?: {
          errors?: Record<string, string[]>;
        };
      };

    const passwordErrors =
      response.error?.errors?.['password'];

    if (
      response.status === 422 &&
      passwordErrors?.length
    ) {
      return (
        passwordErrors[0] ??
        'La contraseña no es válida.'
      );
    }

    return 'No fue posible reautenticar al usuario.';
  }

  previousPage(): void {
    const pagination = this.meta();

    if (
      pagination === null ||
      pagination.current_page <= 1
    ) {
      return;
    }

    this.loadPage(
      pagination.current_page - 1,
    );
  }

  nextPage(): void {
    const pagination = this.meta();

    if (
      pagination === null ||
      pagination.current_page >= pagination.last_page
    ) {
      return;
    }

    this.loadPage(
      pagination.current_page + 1,
    );
  }


}
