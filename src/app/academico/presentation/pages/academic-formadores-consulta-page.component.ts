import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";

interface Trainer {
  id_registro: string;
  id_persona: string;
  num_expediente: string | null;
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  estatus_persona: string;
}

interface TrainerListing {
  data: Trainer[];
  meta: {
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
  };
}

type StateFilter = "TODOS" | "ACTIVO" | "NO_ACTIVO";

import { AcademicTrainersNavigationComponent } from "../components/academic-trainers-navigation.component";
@Component({
  selector: "app-academic-formadores-consulta-page",
  standalone: true,
  imports: [RouterLink, AcademicTrainersNavigationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <app-academic-trainers-navigation />
      <header class="space-y-3">
        <a
          routerLink="/academico/formadores"
          class="text-sm font-semibold text-[#611232] underline"
        >
          Personal formador
        </a>

        <h1 class="text-2xl font-bold text-[#611232]">
          Consulta e indicadores de formadores
        </h1>

        <p class="text-sm text-gray-700">
          Consulta institucional por nombre o expediente. Los indicadores
          de estado corresponden únicamente a la página consultada.
        </p>
      </header>

      <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="md:col-span-2">
            <label for="formadores-buscar" class="block text-sm font-semibold">
              Buscar por nombre o expediente
            </label>

            <input
              id="formadores-buscar"
              data-testid="formadores-buscar"
              type="search"
              [value]="searchText()"
              (input)="updateSearch($event)"
              (keydown.enter)="search()"
              placeholder="Nombre o número de expediente"
              class="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm"
            />
          </div>

          <div>
            <label for="formadores-estado" class="block text-sm font-semibold">
              Filtrar estado en la página
            </label>

            <select
              id="formadores-estado"
              data-testid="formadores-estado"
              [value]="stateFilter()"
              (change)="changeState($event)"
              class="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm"
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVO">Activos</option>
              <option value="NO_ACTIVO">No activos</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            (click)="search()"
            [disabled]="loading()"
            class="rounded-xl bg-[#611232] px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            Buscar
          </button>

          <button
            type="button"
            (click)="clear()"
            [disabled]="loading()"
            class="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-[#611232] disabled:opacity-50"
          >
            Limpiar filtros
          </button>

          <a
            routerLink="/academico/formadores"
            class="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-[#611232]"
          >
            Registro individual
          </a>
        </div>
      </section>

      <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Indicadores de formadores">
        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <p class="text-sm text-gray-600">Total de la búsqueda</p>
          <p class="mt-2 text-3xl font-bold text-[#611232]" data-testid="formadores-total">
            {{ total() }}
          </p>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <p class="text-sm text-gray-600">Activos en página</p>
          <p class="mt-2 text-3xl font-bold">{{ activePage() }}</p>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <p class="text-sm text-gray-600">No activos en página</p>
          <p class="mt-2 text-3xl font-bold">{{ inactivePage() }}</p>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <p class="text-sm text-gray-600">Visibles con filtro</p>
          <p class="mt-2 text-3xl font-bold">{{ visibleRows().length }}</p>
        </div>
      </section>

      <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-bold text-[#611232]">Directorio de formadores</h2>

          <p class="text-sm text-gray-600">
            Página {{ page() }} de {{ lastPage() }}
          </p>
        </div>

        @if (loading()) {
          <p role="status" class="py-5 text-sm">Consultando formadores...</p>
        }

        @if (error()) {
          <p role="alert" class="rounded-lg border border-red-300 p-3 text-sm text-red-800">
            {{ error() }}
          </p>
        }

        @if (!loading() && !error()) {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[650px] border-collapse text-left text-sm">
              <thead class="border-b border-gray-300 bg-gray-50">
                <tr>
                  <th class="p-3">Expediente</th>
                  <th class="p-3">Personal formador</th>
                  <th class="p-3">Estado de Persona</th>
                </tr>
              </thead>

              <tbody>
                @for (person of visibleRows(); track person.id_registro) {
                  <tr class="border-b border-gray-200">
                    <td class="p-3">{{ person.num_expediente || "No registrado" }}</td>
                    <td class="p-3 font-medium">{{ fullName(person) }}</td>
                    <td class="p-3">{{ person.estatus_persona }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (visibleRows().length === 0) {
            <p role="status" class="py-4 text-sm text-gray-600">
              No hay registros visibles con los filtros aplicados en esta página.
            </p>
          }
        }

        <div class="mt-5 flex justify-end gap-3">
          <button
            type="button"
            [disabled]="loading() || page() <= 1"
            (click)="goToPage(page() - 1)"
            class="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50"
          >
            Anterior
          </button>

          <button
            type="button"
            [disabled]="loading() || page() >= lastPage()"
            (click)="goToPage(page() + 1)"
            class="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </section>
    </main>
  `,
})
export class AcademicFormadoresConsultaPageComponent {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchText = signal("");
  readonly appliedSearch = signal("");
  readonly stateFilter = signal<StateFilter>("TODOS");
  readonly rows = signal<Trainer[]>([]);
  readonly page = signal(1);
  readonly lastPage = signal(1);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal("");

  readonly activePage = computed(
    () => this.rows().filter((r) => r.estatus_persona === "ACTIVO").length,
  );

  readonly inactivePage = computed(
    () => this.rows().filter((r) => r.estatus_persona !== "ACTIVO").length,
  );

  readonly visibleRows = computed(() => {
    const filter = this.stateFilter();

    return this.rows().filter((row) => {
      if (filter === "TODOS") return true;
      if (filter === "ACTIVO") return row.estatus_persona === "ACTIVO";
      return row.estatus_persona !== "ACTIVO";
    });
  });

  constructor() {
    this.load();
  }

  updateSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  changeState(event: Event): void {
    this.stateFilter.set(
      (event.target as HTMLSelectElement).value as StateFilter,
    );
  }

  search(): void {
    this.appliedSearch.set(this.searchText().trim());
    this.page.set(1);
    this.load();
  }

  clear(): void {
    this.searchText.set("");
    this.appliedSearch.set("");
    this.stateFilter.set("TODOS");
    this.page.set(1);
    this.load();
  }

  goToPage(next: number): void {
    if (next < 1 || next > this.lastPage() || this.loading()) return;
    this.page.set(next);
    this.load();
  }

  fullName(person: Trainer): string {
    return [
      person.nombres,
      person.apellido_paterno,
      person.apellido_materno,
    ].filter(Boolean).join(" ");
  }

  private load(): void {
    this.loading.set(true);
    this.error.set("");

    const url =
      `/api/academico/formadores?page=${this.page()}&per_page=20` +
      `&q=${encodeURIComponent(this.appliedSearch())}`;

    this.http
      .get<TrainerListing>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.rows.set(response.data);
          this.total.set(response.meta.total);
          this.page.set(response.meta.current_page);
          this.lastPage.set(Math.max(1, response.meta.last_page));
          this.loading.set(false);
        },
        error: (response: HttpErrorResponse) => {
          this.rows.set([]);
          this.total.set(0);
          this.error.set(
            typeof response.error?.message === "string"
              ? response.error.message
              : "No fue posible consultar el directorio.",
          );
          this.loading.set(false);
        },
      });
  }
}