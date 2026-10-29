import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AvailablePerson } from "../../../user.models";
import { UserService } from "../../../user.service";

@Component({
  selector: "app-available-person-selector",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-xl border border-[#e7e2e3] bg-white p-4">
      <h2 class="text-base font-semibold text-[#611232]">
        Seleccionar Persona registrada
      </h2>
      <p class="mt-1 text-xs text-[#666666]">
        Solo aparecen Personas sin cuenta de usuario asociada.
      </p>

      @if (loading()) {
        <p role="status" class="mt-4 text-sm text-gray-600">
          Buscando Personas...
        </p>
      }

      @if (error()) {
        <div role="alert" class="mt-4 text-sm text-red-700">
          {{ error() }}
          <button
            type="button"
            class="ml-2 underline"
            (click)="loadPage(page())"
          >
            Reintentar
          </button>
        </div>
      }

      @if (loading() || !error()) {
        <div class="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table class="w-full min-w-[760px] text-left text-sm">
            <thead class="bg-[#faf9f7] text-[#611232]">
              <tr>
                <th scope="col" class="px-3 py-3 font-semibold">
                  <label for="filtro-persona-usuario" class="block">
                    Persona
                  </label>
                  <input
                    id="filtro-persona-usuario"
                    type="search"
                    maxlength="100"
                    placeholder="Nombre o apellidos"
                    class="siga-focus mt-2 w-full min-w-40 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-normal text-gray-800"
                    [value]="searchText()"
                    (input)="searchText.set($any($event.target).value)"
                    (change)="applyFilters()"
                    (keydown.enter)="applyFilters()"
                  />
                </th>
                <th scope="col" class="px-3 py-3 font-semibold">
                  <label for="filtro-expediente-usuario" class="block">
                    Expediente
                  </label>
                  <input
                    id="filtro-expediente-usuario"
                    type="search"
                    maxlength="13"
                    placeholder="Número de expediente"
                    class="siga-focus mt-2 w-full min-w-36 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-normal text-gray-800"
                    [value]="expedienteFilter()"
                    (change)="
                      expedienteFilter.set($any($event.target).value);
                      applyFilters()
                    "
                  />
                </th>
                <th scope="col" class="px-3 py-3 font-semibold">
                  <label for="filtro-fecha-usuario" class="block">
                    Fecha y hora de registro
                  </label>
                  <input
                    id="filtro-fecha-usuario"
                    type="date"
                    class="siga-focus mt-2 w-full min-w-40 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-normal text-gray-800"
                    [value]="fechaFilter()"
                    (change)="
                      fechaFilter.set($any($event.target).value); applyFilters()
                    "
                  />
                </th>
                <th scope="col" class="px-3 py-3 font-semibold">
                  <label for="filtro-origen-usuario" class="block">
                    Origen del registro
                  </label>
                  <select
                    id="filtro-origen-usuario"
                    class="siga-focus mt-2 w-full min-w-44 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-normal text-gray-800"
                    [value]="origenFilter()"
                    (change)="setOriginFilter($any($event.target).value)"
                  >
                    <option value="">Todos los orígenes</option>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="MASIVO">Importación de archivo</option>
                    <option value="NO_DETERMINADO">No determinado</option>
                  </select>
                </th>
                <th scope="col" class="px-3 py-3 text-right font-semibold">
                  <span class="block">Acción</span>
                  <button
                    type="button"
                    class="siga-focus mt-2 rounded-lg border border-[#611232] px-2 py-1.5 text-xs font-medium text-[#611232]"
                    (click)="clearFilters()"
                  >
                    Limpiar filtros
                  </button>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (person of persons(); track person.id_persona) {
                <tr class="hover:bg-[#faf9f7]">
                  <td class="px-3 py-3 font-medium text-gray-800">
                    {{ person.nombres }}
                    {{ person.apellido_paterno }}
                    {{ person.apellido_materno }}
                  </td>
                  <td class="px-3 py-3 text-gray-600">
                    {{ person.num_expediente }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-3 text-gray-600">
                    {{ formatRegistrationDate(person.fecha_registro) }}
                  </td>
                  <td class="px-3 py-3 text-gray-600">
                    {{ registrationOriginLabel(person.forma_registro) }}
                  </td>
                  <td class="px-3 py-3 text-right">
                    <button
                      type="button"
                      class="siga-focus rounded-lg border border-[#611232] px-3 py-1.5 text-xs font-medium text-[#611232]"
                      (click)="personSelected.emit(person)"
                    >
                      Seleccionar
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-3 py-5 text-center text-gray-500">
                    {{
                      loading()
                        ? "Consultando Personas..."
                        : "No se encontraron Personas disponibles."
                    }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="mt-3 flex items-center justify-between gap-3 border-t pt-3">
          <button
            type="button"
            class="text-xs font-medium text-[#611232] disabled:opacity-40"
            [disabled]="loading() || page() <= 1"
            (click)="loadPage(page() - 1)"
          >
            Anterior
          </button>
          <span class="text-xs text-gray-600">
            Página {{ page() }} de {{ lastPage() }} · {{ total() }} registros
          </span>
          <button
            type="button"
            class="text-xs font-medium text-[#611232] disabled:opacity-40"
            [disabled]="loading() || page() >= lastPage()"
            (click)="loadPage(page() + 1)"
          >
            Siguiente
          </button>
        </div>
      }
    </section>
  `,
})
export class AvailablePersonSelectorComponent implements OnInit {
  private readonly service = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly personSelected = output<AvailablePerson>();

  readonly searchText = signal("");
  readonly expedienteFilter = signal("");
  readonly fechaFilter = signal("");
  readonly origenFilter = signal<
    "" | "INDIVIDUAL" | "MASIVO" | "NO_DETERMINADO"
  >("");
  readonly persons = signal<AvailablePerson[]>([]);
  readonly page = signal(1);
  readonly lastPage = signal(1);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private requestVersion = 0;

  formatRegistrationDate(value: string | null | undefined): string {
    if (!value) return "No disponible";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "No disponible";
    }

    return new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date);
  }

  registrationOriginLabel(
    value: "INDIVIDUAL" | "MASIVO" | "NO_DETERMINADO" | undefined,
  ): string {
    switch (value) {
      case "INDIVIDUAL":
        return "Registro individual";
      case "MASIVO":
        return "Importación de archivo";
      default:
        return "No determinado";
    }
  }
  ngOnInit(): void {
    this.loadPage(1);
  }

  search(event: Event): void {
    event.preventDefault();
    this.applyFilters();
  }

  applyFilters(): void {
    this.loadPage(1);
  }

  setOriginFilter(value: string): void {
    if (
      value !== "" &&
      value !== "INDIVIDUAL" &&
      value !== "MASIVO" &&
      value !== "NO_DETERMINADO"
    ) {
      return;
    }

    this.origenFilter.set(value);
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchText.set("");
    this.expedienteFilter.set("");
    this.fechaFilter.set("");
    this.origenFilter.set("");
    this.applyFilters();
  }

  loadPage(page: number): void {
    if (page < 1 || (page > this.lastPage() && page !== 1)) {
      return;
    }

    const version = ++this.requestVersion;
    this.loading.set(true);
    this.error.set(null);
    this.persons.set([]);

    this.service
      .availablePersons("", page, {
        persona: this.searchText().trim(),
        expediente: this.expedienteFilter().trim(),
        fecha_registro: this.fechaFilter(),
        forma_registro: this.origenFilter(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (version !== this.requestVersion) return;

          this.persons.set(response.data);
          this.page.set(response.meta.current_page);
          this.lastPage.set(response.meta.last_page);
          this.total.set(response.meta.total);
          this.loading.set(false);
        },
        error: () => {
          if (version !== this.requestVersion) return;

          this.error.set("No fue posible consultar las Personas.");
          this.loading.set(false);
        },
      });
  }
}
