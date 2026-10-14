import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { AuthService } from '../auth/auth.service';
import {
  PersonDetail,
  PersonListItem,
  PersonListMeta,
} from './person.models';
import { PersonService } from './person.service';

@Component({
  selector: 'app-personas-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
  ],
  template: `
    <main
      class="siga-texture min-h-screen bg-[#f7f7f5] text-[#161a1d]"
    >
      <header
        class="w-full overflow-hidden border-b border-[#a57f2c]/30 bg-white shadow-sm"
      >
        <img
          src="/branding/sesnsp-2026-banner.jpg"
          alt="Identidad institucional de la Secretaría de Seguridad y del Secretariado Ejecutivo del Sistema Nacional de Seguridad Pública"
          class="block h-auto w-full"
        />
      </header>

      <section
        class="border-b border-[#a57f2c]/20 bg-[#611232] text-white shadow-md"
      >
        <div
          class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        >
          <p
            class="text-xs font-semibold uppercase tracking-[0.18em] text-[#e6d194]"
          >
            Plataforma Integral
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
              Consulta de personas registradas en la Plataforma Integral SIGA.
            </p>

            @if (canCreatePerson()) {
              <button
                type="button"
                data-testid="persona-register"
                (click)="openRegisterForm()"
                class="siga-focus mt-6 rounded-lg bg-[#611232] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9b2247]"
              >
                Registrar persona
              </button>
            }

            @if (registerSuccessMessage()) {
              <div
                data-testid="persona-register-success"
                class="mt-6 rounded-lg border border-[#1e5b4f]/30 bg-white p-4 text-sm font-semibold text-[#1e5b4f]"
                role="status"
              >
                {{ registerSuccessMessage() }}
              </div>
            }

            @if (registerFormOpen()) {
              <form
                data-testid="persona-register-form"
                [formGroup]="registerForm"
                (ngSubmit)="submitRegisterForm()"
                class="mt-8 rounded-xl border border-[#a57f2c]/30 bg-[#f7f7f5] p-6"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b2247]"
                >
                  Alta de Persona
                </p>

                <h3
                  class="siga-title mt-2 text-2xl font-bold text-[#611232]"
                >
                  Registrar persona
                </h3>

                <p
                  class="mt-3 text-sm leading-6 text-[#555555]"
                >
                  Captura los datos requeridos para registrar una nueva persona en SIGA.
                </p>

                <div
                  class="mt-6 grid gap-5 md:grid-cols-3"
                >
                  <div>
                    <label
                      for="persona-nombres"
                      class="block text-sm font-semibold text-[#611232]"
                    >
                      Nombres
                    </label>

                    <input
                      id="persona-nombres"
                      data-testid="persona-nombres"
                      formControlName="nombres"
                      type="text"
                      autocomplete="given-name"
                      class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
                    />
                  </div>

                  <div>
                    <label
                      for="persona-apellido-paterno"
                      class="block text-sm font-semibold text-[#611232]"
                    >
                      Apellido paterno
                    </label>

                    <input
                      id="persona-apellido-paterno"
                      data-testid="persona-apellido-paterno"
                      formControlName="apellido_paterno"
                      type="text"
                      autocomplete="family-name"
                      class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
                    />
                  </div>

                  <div>
                    <label
                      for="persona-apellido-materno"
                      class="block text-sm font-semibold text-[#611232]"
                    >
                      Apellido materno
                    </label>

                    <input
                      id="persona-apellido-materno"
                      data-testid="persona-apellido-materno"
                      formControlName="apellido_materno"
                      type="text"
                      class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
                    />
                  </div>
                </div>

                <div
                  class="mt-6 grid gap-5 md:grid-cols-3"
                >
                  <div>
                    <label
                      for="persona-fecha-nacimiento"
                      class="block text-sm font-semibold text-[#611232]"
                    >
                      Fecha de nacimiento
                    </label>

                    <input
                      id="persona-fecha-nacimiento"
                      data-testid="persona-fecha-nacimiento"
                      formControlName="fecha_nacimiento"
                      type="date"
                      class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
                    />
                  </div>

                  <div>
                    <label
                      for="persona-sexo"
                      class="block text-sm font-semibold text-[#611232]"
                    >
                      Sexo
                    </label>

                    <select
                      id="persona-sexo"
                      data-testid="persona-sexo"
                      formControlName="sexo"
                      class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
                    >
                      <option value="">
                        No especificado
                      </option>
                      <option value="MASCULINO">
                        Masculino
                      </option>
                      <option value="FEMENINO">
                        Femenino
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      for="persona-estado-civil"
                      class="block text-sm font-semibold text-[#611232]"
                    >
                      Estado civil
                    </label>

                    <select
                      id="persona-estado-civil"
                      data-testid="persona-estado-civil"
                      formControlName="estado_civil"
                      class="siga-focus mt-2 w-full rounded-lg border border-[#98989a]/40 bg-white px-4 py-3 text-[#161a1d]"
                    >
                      <option value="">
                        No especificado
                      </option>
                      <option value="SOLTERO">
                        Soltero
                      </option>
                      <option value="CASADO">
                        Casado
                      </option>
                    </select>
                  </div>
                </div>

                @if (registerErrorMessage()) {
                  <div
                    data-testid="persona-register-error"
                    class="mt-6 rounded-lg border border-[#9b2247]/30 bg-white p-4 text-sm font-semibold text-[#9b2247]"
                    role="alert"
                  >
                    {{ registerErrorMessage() }}
                  </div>
                }

                @if (registerFechaNacimientoError()) {
                  <p
                    data-testid="persona-fecha-nacimiento-error"
                    class="mt-4 text-sm font-semibold text-[#9b2247]"
                    role="alert"
                  >
                    {{ registerFechaNacimientoError() }}
                  </p>
                }

                @if (registerNombresError()) {
                  <p
                    data-testid="persona-nombres-error"
                    class="mt-4 text-sm font-semibold text-[#9b2247]"
                    role="alert"
                  >
                    {{ registerNombresError() }}
                  </p>
                }

                @if (registerApellidosError()) {
                  <p
                    data-testid="persona-apellidos-error"
                    class="mt-2 text-sm font-semibold text-[#9b2247]"
                    role="alert"
                  >
                    {{ registerApellidosError() }}
                  </p>
                }

                <p
                  class="mt-4 text-xs text-[#555555]"
                >
                  Nombres es obligatorio. Debe capturarse al menos uno de los dos apellidos.
                </p>

                <div
                  class="mt-6 flex flex-wrap gap-3"
                >
                  <button
                    type="submit"
                    data-testid="persona-register-submit"
                    class="siga-focus rounded-lg bg-[#611232] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9b2247]"
                  >
                    Guardar persona
                  </button>

                  <button
                    type="button"
                    data-testid="persona-register-cancel"
                    (click)="cancelRegisterForm()"
                    class="siga-focus rounded-lg border border-[#611232]/30 bg-white px-5 py-3 text-sm font-semibold text-[#611232] transition hover:bg-[#611232]/5"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            }

            @if (detailErrorMessage()) {
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
            } @else if (selectedPerson()) {
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
                      {{ fullName(selectedPerson()!) }}
                    </h3>
                  </div>

                  <span
                    class="rounded-full border border-[#a57f2c]/30 bg-white px-3 py-1 text-sm font-semibold text-[#611232]"
                  >
                    {{ selectedPerson()!.estatus }}
                  </span>
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
                      {{ selectedPerson()!.num_expediente }}
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
                      {{ selectedPerson()!.sexo ?? 'No registrado' }}
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
                      {{ selectedPerson()!.estado_civil ?? 'No registrado' }}
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
                      {{ selectedPerson()!.fecha_nacimiento ?? 'No registrada' }}
                    </dd>
                  </div>
                </dl>
              </section>
            }

            @if (errorMessage()) {
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
            } @else if (persons().length === 0) {
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
                      person of persons();
                      track person.id_persona
                    ) {
                      <tr
                        class="border-t border-[#98989a]/20"
                      >
                        <td
                          class="whitespace-nowrap px-4 py-3 text-sm font-medium text-[#611232]"
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
                          {{ person.estatus }}
                        </td>

                        <td
                          class="whitespace-nowrap px-4 py-3"
                        >
                          <button
                            type="button"
                            data-testid="persona-view-detail"
                            (click)="viewDetail(person.id_persona)"
                            class="siga-focus rounded-lg border border-[#611232] px-3 py-2 text-sm font-semibold text-[#611232] transition hover:bg-[#611232] hover:text-white"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            @if (meta()) {
              <div
                class="mt-4 flex flex-wrap items-center justify-between gap-4"
              >
                <p
                  class="text-sm text-[#555555]"
                >
                  Total de personas:
                  <strong>{{ meta()!.total }}</strong>
                </p>

                <div
                  class="flex items-center gap-3"
                >
                  <button
                    type="button"
                    data-testid="personas-previous-page"
                    (click)="previousPage()"
                    [disabled]="meta()!.current_page <= 1"
                    class="siga-focus rounded-lg border border-[#611232] px-4 py-2 text-sm font-semibold text-[#611232] transition hover:bg-[#611232] hover:text-white disabled:cursor-not-allowed disabled:border-[#98989a]/40 disabled:text-[#98989a] disabled:hover:bg-transparent"
                  >
                    Anterior
                  </button>

                  <span
                    class="text-sm text-[#555555]"
                  >
                    Página
                    <strong>{{ meta()!.current_page }}</strong>
                    de
                    <strong>{{ meta()!.last_page }}</strong>
                  </span>

                  <button
                    type="button"
                    data-testid="personas-next-page"
                    (click)="nextPage()"
                    [disabled]="meta()!.current_page >= meta()!.last_page"
                    class="siga-focus rounded-lg border border-[#611232] px-4 py-2 text-sm font-semibold text-[#611232] transition hover:bg-[#611232] hover:text-white disabled:cursor-not-allowed disabled:border-[#98989a]/40 disabled:text-[#98989a] disabled:hover:bg-transparent"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            }
          </div>
        </section>
      </div>
    </main>
  `,
})
export class PersonasPageComponent implements OnInit {
  private readonly auth = inject(AuthService);

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

  readonly registerFormOpen = signal(false);

  readonly birthDateValidationTimeZone =
    'America/Mexico_City';

  readonly registerForm = new FormGroup({
    nombres: new FormControl('', {
      nonNullable: true,
    }),
    apellido_paterno: new FormControl('', {
      nonNullable: true,
    }),
    apellido_materno: new FormControl('', {
      nonNullable: true,
    }),
    fecha_nacimiento: new FormControl('', {
      nonNullable: true,
    }),
    sexo: new FormControl('', {
      nonNullable: true,
    }),
    estado_civil: new FormControl('', {
      nonNullable: true,
    }),
  });

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
    this.auth.currentUser().subscribe({
      next: (user) => {
        this.canCreatePerson.set(
          user.permissions.includes(
            'personas.crear',
          ),
        );
      },
      error: () => {
        this.canCreatePerson.set(false);
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

    const nombres =
      this.registerForm.controls.nombres.value.trim();

    const apellidoPaterno =
      this.registerForm.controls.apellido_paterno.value.trim();

    const apellidoMaterno =
      this.registerForm.controls.apellido_materno.value.trim();

    const fechaNacimiento =
      this.registerForm.controls.fecha_nacimiento.value.trim();

    const sexo =
      this.registerForm.controls.sexo.value.trim();

    const estadoCivil =
      this.registerForm.controls.estado_civil.value.trim();

    const fechaActualParts = new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone:
          this.birthDateValidationTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      },
    ).formatToParts(
      new Date(),
    );

    const getDatePart = (
      type: 'year' | 'month' | 'day',
    ): string =>
      fechaActualParts.find(
        (part) => part.type === type,
      )?.value ?? '';

    const fechaActual = [
      getDatePart('year'),
      getDatePart('month'),
      getDatePart('day'),
    ].join('-');

    const fechaNacimientoEsFutura =
      fechaNacimiento !== '' &&
      fechaNacimiento > fechaActual;

    this.registerNombresError.set(
      nombres === ''
        ? 'Los nombres son obligatorios'
        : null,
    );

    this.registerApellidosError.set(
      apellidoPaterno === '' &&
      apellidoMaterno === ''
        ? 'Debe capturarse al menos un apellido'
        : null,
    );

    this.registerFechaNacimientoError.set(
      fechaNacimientoEsFutura
        ? 'La fecha de nacimiento no puede ser futura'
        : null,
    );

    if (
      nombres === '' ||
      (
        apellidoPaterno === '' &&
        apellidoMaterno === ''
      ) ||
      fechaNacimientoEsFutura
    ) {
      return;
    }

    this.personService
      .create({
        nombres,
        apellido_paterno:
          apellidoPaterno === ''
            ? null
            : apellidoPaterno,
        apellido_materno:
          apellidoMaterno === ''
            ? null
            : apellidoMaterno,
        ...(fechaNacimiento !== ''
          ? {
              fecha_nacimiento:
                fechaNacimiento,
            }
          : {}),
        ...(sexo !== ''
          ? {
              sexo,
            }
          : {}),
        ...(estadoCivil !== ''
          ? {
              estado_civil:
                estadoCivil,
            }
          : {}),
      })
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

  fullName(
    person: PersonListItem,
  ): string {
    return [
      person.nombres,
      person.apellido_paterno,
      person.apellido_materno,
    ]
      .filter(
        (part): part is string =>
          part !== null &&
          part.trim() !== '',
      )
      .join(' ');
  }
}
