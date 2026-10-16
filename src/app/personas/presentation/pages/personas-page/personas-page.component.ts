import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { AuthContextService } from '../../../../auth/auth-context.service';
import { AuthService } from '../../../../auth/auth.service';
import {
  PersonDetail,
  PersonListItem,
  PersonListMeta,
} from '../../../person.models';
import { PersonService } from '../../../person.service';
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
import { PersonasManagementTemplateComponent } from '../../templates/personas-management-template/personas-management-template.component';



@Component({
  selector: 'app-personas-page',
  standalone: true,
  imports: [
    PersonasManagementTemplateComponent,
  ],
  template: `
    <app-personas-management-template
      [canCreatePerson]="canCreatePerson()"
      [registerSuccessMessage]="registerSuccessMessage()"
      [editSuccessMessage]="editSuccessMessage()"
      [withdrawSuccessMessage]="withdrawSuccessMessage()"
      [reinstateSuccessMessage]="reinstateSuccessMessage()"

      [withdrawFormOpen]="withdrawFormOpen()"
      [withdrawingPerson]="withdrawingPerson()"
      [withdrawForm]="withdrawForm"
      [withdrawPasswordError]="withdrawPasswordError()"
      [withdrawErrorMessage]="withdrawErrorMessage()"

      [reinstateFormOpen]="reinstateFormOpen()"
      [reinstatingPerson]="reinstatingPerson()"
      [reinstateForm]="reinstateForm"
      [reinstatePasswordError]="reinstatePasswordError()"
      [reinstateErrorMessage]="reinstateErrorMessage()"

      [registerFormOpen]="registerFormOpen()"
      [registerForm]="registerForm"
      [registerErrorMessage]="registerErrorMessage()"
      [registerFechaNacimientoError]="registerFechaNacimientoError()"
      [registerNombresError]="registerNombresError()"
      [registerApellidosError]="registerApellidosError()"

      [editFormOpen]="editFormOpen()"
      [editForm]="editForm"
      [editErrorMessage]="editErrorMessage()"
      [editNombresError]="editNombresError()"
      [editApellidosError]="editApellidosError()"
      [editFechaNacimientoError]="editFechaNacimientoError()"

      [selectedPerson]="selectedPerson()"
      [detailErrorMessage]="detailErrorMessage()"

      [persons]="persons()"
      [meta]="meta()"
      [errorMessage]="errorMessage()"
      [canUpdatePerson]="canUpdatePerson()"
      [canWithdrawPerson]="canWithdrawPerson()"
      [canReinstatePerson]="canReinstatePerson()"

      (openRegisterRequested)="openRegisterForm()"
      (submitRegisterRequested)="submitRegisterForm()"
      (cancelRegisterRequested)="cancelRegisterForm()"

      (submitEditRequested)="submitEditForm()"
      (cancelEditRequested)="cancelEditForm()"

      (submitWithdrawRequested)="submitWithdrawForm()"
      (cancelWithdrawRequested)="cancelWithdrawForm()"

      (submitReinstateRequested)="submitReinstateForm()"
      (cancelReinstateRequested)="cancelReinstateForm()"

      (closeDetailRequested)="closeDetail()"
      (viewDetailRequested)="viewDetail($event)"
      (editRequested)="openEditForm($event)"
      (withdrawRequested)="openWithdrawForm($event)"
      (reinstateRequested)="openReinstateForm($event)"
      (previousPageRequested)="previousPage()"
      (nextPageRequested)="nextPage()"
    />
  `,
})
export class PersonasPageComponent implements OnInit {
  private readonly auth = inject(AuthService);

  private readonly authContext = inject(AuthContextService);

  private readonly personService = inject(
    PersonService,
  );

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

  readonly registerFormOpen = signal(false);

  readonly editFormOpen = signal(false);

  readonly editingPersonId = signal<string | null>(
    null,
  );

  readonly withdrawFormOpen = signal(false);

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

  readonly reinstateFormOpen = signal(false);

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

  readonly withdrawForm = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
    }),
  });

  readonly reinstateForm = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
    }),
  });

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
    this.errorMessage.set(null);

    this.personService
      .list(page)
      .subscribe({
        next: (response) => {
          this.persons.set(response.data);
          this.meta.set(response.meta);
        },
        error: () => {
          this.errorMessage.set(
            'No fue posible cargar el listado de personas',
          );
        },
      });
  }

  closeDetail(): void {
    this.selectedPerson.set(null);
    this.detailErrorMessage.set(null);
  }

  viewDetail(
    idPersona: string,
  ): void {
    this.selectedPerson.set(null);
    this.detailErrorMessage.set(null);

    this.personService
      .find(idPersona)
      .subscribe({
        next: (person) => {
          this.selectedPerson.set(person);
        },
        error: () => {
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
    this.editSuccessMessage.set(null);
    this.editErrorMessage.set(null);
    this.editFormOpen.set(false);
    this.editingPersonId.set(null);

    this.personService
      .find(idPersona)
      .subscribe({
        next: (person) => {
          this.editingPersonId.set(
            person.id_persona,
          );

          this.editForm.setValue(
            personFormValueFromDetail(person),
          );
          this.registerFormOpen.set(false);
          this.editFormOpen.set(true);
        },
        error: () => {
          this.editFormOpen.set(false);
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

    this.editFormOpen.set(false);
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

          this.editFormOpen.set(false);
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
    this.withdrawForm.reset();
    this.withdrawPasswordError.set(null);
    this.withdrawErrorMessage.set(null);
    this.withdrawSuccessMessage.set(null);
    this.withdrawingPerson.set(person);

    this.registerFormOpen.set(false);
    this.editFormOpen.set(false);

    this.withdrawFormOpen.set(true);
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

    this.auth
      .reauthenticate(password)
      .subscribe({
        next: () => {
          this.withdrawErrorMessage.set(null);

          this.personService
            .withdraw(person.id_persona)
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
                this.withdrawFormOpen.set(false);

                this.withdrawSuccessMessage.set(
                  'Persona dada de baja correctamente',
                );

                this.loadPage(currentPage);
              },
              error: (error: unknown) => {
                const response = error as {
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

          const passwordErrors =
            response.error?.errors?.[
              'password'
            ];

          if (
            response.status === 422 &&
            passwordErrors?.length
          ) {
            this.withdrawPasswordError.set(
              passwordErrors[0] ??
                'La contraseña no es válida.',
            );

            return;
          }

          this.withdrawPasswordError.set(
            'No fue posible reautenticar al usuario.',
          );
        },
      });
  }
  cancelWithdrawForm(): void {
    this.withdrawForm.reset();
    this.withdrawPasswordError.set(null);
    this.withdrawErrorMessage.set(null);
    this.withdrawingPerson.set(null);
    this.withdrawFormOpen.set(false);
  }
  openReinstateForm(
    person: PersonListItem,
  ): void {
    this.reinstateForm.reset();
    this.reinstatePasswordError.set(null);
    this.reinstateErrorMessage.set(null);
    this.reinstateSuccessMessage.set(null);
    this.reinstatingPerson.set(person);

    this.cancelWithdrawForm();

    this.registerFormOpen.set(false);
    this.editFormOpen.set(false);

    this.reinstateFormOpen.set(true);
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

    this.auth
      .reauthenticate(password)
      .subscribe({
        next: () => {
          this.personService
            .reinstate(person.id_persona)
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
                this.reinstateFormOpen.set(false);

                this.reinstateSuccessMessage.set(
                  'Persona reingresada correctamente',
                );

                this.loadPage(currentPage);
              },
              error: (error: unknown) => {
                const response = error as {
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

          const passwordErrors =
            response.error?.errors?.[
              'password'
            ];

          if (
            response.status === 422 &&
            passwordErrors?.length
          ) {
            this.reinstatePasswordError.set(
              passwordErrors[0] ??
                'La contraseña no es válida.',
            );

            return;
          }

          this.reinstatePasswordError.set(
            'No fue posible reautenticar al usuario.',
          );
        },
      });
  }
  cancelReinstateForm(): void {
    this.reinstateForm.reset();
    this.reinstatePasswordError.set(null);
    this.reinstateErrorMessage.set(null);
    this.reinstatingPerson.set(null);
    this.reinstateFormOpen.set(false);
  }
  openRegisterForm(): void {
    this.registerSuccessMessage.set(null);
    this.registerErrorMessage.set(null);
    this.registerFormOpen.set(true);
  }

  cancelRegisterForm(): void {
    this.registerForm.reset();

    this.registerNombresError.set(null);
    this.registerApellidosError.set(null);
    this.registerFechaNacimientoError.set(null);
    this.registerErrorMessage.set(null);

    this.registerFormOpen.set(false);
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

          this.registerFormOpen.set(false);

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
