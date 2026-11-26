import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthContextService } from "../../../auth/auth-context.service";

interface Person {
  id_persona: string;
  num_expediente: string | number;
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  estatus: string;
}

interface Trainer {
  id_registro: string;
  id_persona: string;
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  estatus_persona: string;
}

interface Listing<T> {
  data: T[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
  };
}

import { AcademicTrainersNavigationComponent } from "../components/academic-trainers-navigation.component";
@Component({
  selector: "app-academic-trainers-page",
  standalone: true,
  imports: [AcademicTrainersNavigationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="space-y-6">
      <app-academic-trainers-navigation />
      <header class="rounded-2xl bg-white p-6 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-wider text-[#9b2247]">
          Administración académica
        </p>
        <h1 class="mt-2 text-3xl font-bold text-[#611232]">
          Personal formador
        </h1>
        <p class="mt-3 text-sm text-gray-600">
          Registro institucional de docentes e instructores.
          Una Persona puede desempeñar ambas funciones conforme
          a sus asignaciones académicas.
        </p>
      </header>

      <section class="rounded-2xl border bg-white p-5">
        <h2 class="text-lg font-semibold text-[#611232]">
          Formadores registrados
        </h2>

        @if (trainersLoading()) {
          <p class="mt-3" role="status">Consultando formadores...</p>
        } @else if (trainersError()) {
          <p class="mt-3 text-red-700" role="alert">{{ trainersError() }}</p>
        } @else if (trainers().length === 0) {
          <p class="mt-3 text-amber-800">
            Todavía no existen formadores registrados en esta consulta.
          </p>
        } @else {
          <p class="mt-2 text-sm text-gray-500">
            Total registrado: {{ trainerTotal() }}
          </p>

          <div class="mt-4 space-y-2">
            @for (trainer of trainers(); track trainer.id_registro) {
              <article class="rounded-lg border p-3">
                <p class="font-medium">
                  {{ fullName(trainer) }}
                </p>
                <p class="text-xs text-gray-500">
                  Estado de Persona: {{ trainer.estatus_persona }}
                </p>
              </article>
            }
          </div>
        }

        <div class="mt-4 flex items-center gap-3">
          <button type="button"
            class="rounded-lg border px-3 py-2 text-sm"
            [disabled]="trainersLoading() || trainerPage() <= 1"
            (click)="loadTrainers(trainerPage() - 1)">
            Anterior
          </button>
          <span class="text-sm">
            Página {{ trainerPage() }} de {{ trainerLastPage() }}
          </span>
          <button type="button"
            class="rounded-lg border px-3 py-2 text-sm"
            [disabled]="trainersLoading() || trainerPage() >= trainerLastPage()"
            (click)="loadTrainers(trainerPage() + 1)">
            Siguiente
          </button>
        </div>
      </section>

      @if (canRegister() && canViewPersons()) {
        <section class="rounded-2xl border bg-white p-5">
          <h2 class="text-lg font-semibold text-[#611232]">
            Registrar personal formador
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Selecciona una Persona institucional existente y activa.
            No se crean Usuarios, roles ni permisos en esta operación.
          </p>

          @if (personsLoading()) {
            <p class="mt-4" role="status">Consultando Personas...</p>
          } @else if (personsError()) {
            <p class="mt-4 text-red-700" role="alert">
              {{ personsError() }}
            </p>
          } @else {
            <div class="mt-4 space-y-2">
              @for (person of persons(); track person.id_persona) {
                <div class="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p class="text-sm font-medium">{{ fullName(person) }}</p>
                    <p class="text-xs text-gray-500">
                      Expediente: {{ person.num_expediente }}
                      · Estado: {{ person.estatus }}
                    </p>
                  </div>
                  <button type="button"
                    class="rounded-lg border border-[#611232] px-3 py-2 text-sm text-[#611232] disabled:opacity-40"
                    [disabled]="person.estatus !== 'ACTIVO' || saving()"
                    (click)="selectPerson(person)">
                    Seleccionar
                  </button>
                </div>
              }
            </div>
          }

          <div class="mt-4 flex items-center gap-3">
            <button type="button"
              class="rounded-lg border px-3 py-2 text-sm"
              [disabled]="personsLoading() || personPage() <= 1"
              (click)="loadPersons(personPage() - 1)">
              Anterior
            </button>
            <span class="text-sm">
              Página {{ personPage() }} de {{ personLastPage() }}
            </span>
            <button type="button"
              class="rounded-lg border px-3 py-2 text-sm"
              [disabled]="personsLoading() || personPage() >= personLastPage()"
              (click)="loadPersons(personPage() + 1)">
              Siguiente
            </button>
          </div>

          @if (selectedPerson(); as selected) {
            <div class="mt-5 rounded-xl border border-[#611232]/30 p-4">
              <p class="text-sm font-semibold">Persona seleccionada</p>
              <p class="mt-2">{{ fullName(selected) }}</p>
              <p class="text-sm text-gray-600">
                Expediente: {{ selected.num_expediente }}
              </p>

              <label class="mt-4 flex items-start gap-2 text-sm">
                <input type="checkbox"
                  [checked]="confirmed()"
                  (change)="confirmed.set(!confirmed())" />
                Confirmo que esta Persona corresponde a personal
                formador real de la institución.
              </label>

              <button type="button"
                class="mt-4 rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                [disabled]="!confirmed() || saving()"
                (click)="registerTrainer()">
                {{ saving() ? "Registrando..." : "Registrar formador" }}
              </button>
            </div>
          }

          @if (operationError()) {
            <p class="mt-4 text-red-700" role="alert">
              {{ operationError() }}
            </p>
          }

          @if (operationNotice()) {
            <p class="mt-4 text-green-800" role="status">
              {{ operationNotice() }}
            </p>
          }
        </section>
      } @else {
        <section class="rounded-xl border bg-white p-4">
          <p class="text-sm text-gray-600">
            El registro requiere permisos efectivos de
            administración de formadores y consulta de Personas.
          </p>
        </section>
      }
    </main>
  `,
})
export class AcademicTrainersPageComponent {
  private readonly http = inject(HttpClient);
  private readonly context = inject(AuthContextService);
  private readonly destroyRef = inject(DestroyRef);

  readonly trainers = signal<Trainer[]>([]);
  readonly persons = signal<Person[]>([]);
  readonly trainersLoading = signal(false);
  readonly personsLoading = signal(false);
  readonly trainersError = signal<string | null>(null);
  readonly personsError = signal<string | null>(null);
  readonly operationError = signal<string | null>(null);
  readonly operationNotice = signal<string | null>(null);
  readonly selectedPerson = signal<Person | null>(null);
  readonly confirmed = signal(false);
  readonly saving = signal(false);

  readonly trainerPage = signal(1);
  readonly trainerLastPage = signal(1);
  readonly trainerTotal = signal(0);
  readonly personPage = signal(1);
  readonly personLastPage = signal(1);

  constructor() {
    this.context.ensureCurrent()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadTrainers();
          if (this.canRegister() && this.canViewPersons()) {
            this.loadPersons();
          }
        },
        error: () => {
          this.trainersError.set(
            "No se pudo verificar la sesión institucional."
          );
        },
      });
  }

  canRegister(): boolean {
    return this.context.hasPermission("academico.formadores.registrar");
  }

  canViewPersons(): boolean {
    return this.context.hasPermission("personas.ver");
  }

  fullName(person: Person | Trainer): string {
    return [
      person.nombres,
      person.apellido_paterno,
      person.apellido_materno,
    ].filter(Boolean).join(" ");
  }

  loadTrainers(page = 1): void {
    this.trainersLoading.set(true);
    this.trainersError.set(null);
    this.http.get<Listing<Trainer>>(
      `/api/academico/formadores?page=${page}&per_page=20`
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.trainers.set(result.data);
        this.trainerPage.set(result.meta.current_page);
        this.trainerLastPage.set(Math.max(1, result.meta.last_page));
        this.trainerTotal.set(result.meta.total);
        this.trainersLoading.set(false);
      },
      error: () => {
        this.trainersError.set(
          "No se pudo consultar el registro de formadores."
        );
        this.trainersLoading.set(false);
      },
    });
  }

  loadPersons(page = 1): void {
    if (!this.canRegister() || !this.canViewPersons()) return;
    this.personsLoading.set(true);
    this.personsError.set(null);
    this.selectedPerson.set(null);
    this.confirmed.set(false);

    this.http.get<Listing<Person>>(
      `/api/personas?page=${page}`
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.persons.set(result.data);
        this.personPage.set(result.meta.current_page);
        this.personLastPage.set(Math.max(1, result.meta.last_page));
        this.personsLoading.set(false);
      },
      error: () => {
        this.personsError.set(
          "No se pudo consultar el catálogo autorizado de Personas."
        );
        this.personsLoading.set(false);
      },
    });
  }

  selectPerson(person: Person): void {
    if (person.estatus !== "ACTIVO" || this.saving()) return;
    this.selectedPerson.set(person);
    this.confirmed.set(false);
    this.operationError.set(null);
    this.operationNotice.set(null);
  }

  registerTrainer(): void {
    const person = this.selectedPerson();
    if (
      !person ||
      person.estatus !== "ACTIVO" ||
      !this.confirmed() ||
      this.saving() ||
      !this.canRegister() ||
      !this.canViewPersons()
    ) return;

    this.saving.set(true);
    this.operationError.set(null);
    this.operationNotice.set(null);

    this.http.post(
      "/api/academico/formadores",
      { id_persona: person.id_persona }
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.selectedPerson.set(null);
        this.confirmed.set(false);
        this.operationNotice.set(
          "Personal formador registrado correctamente."
        );
        this.loadTrainers(1);
      },
      error: (error: unknown) => {
        this.saving.set(false);

        const status = error instanceof HttpErrorResponse
          ? error.status : 0;

        this.operationError.set(
          status === 422
            ? "La Persona ya podría estar registrada o no cumple los requisitos."
            : status === 403
              ? "El operador no tiene autorización para registrar formadores."
              : "No se pudo confirmar el registro. Consulta el catálogo antes de repetirlo."
        );
      },
    });
  }
}