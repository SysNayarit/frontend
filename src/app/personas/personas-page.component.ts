import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  PersonDetail,
  PersonListItem,
  PersonListMeta,
} from './person.models';
import { PersonService } from './person.service';

@Component({
  selector: 'app-personas-page',
  standalone: true,
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

  ngOnInit(): void {
    this.loadPage(1);
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
