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

      <form
        class="mt-4 flex flex-wrap gap-2"
        (submit)="search($event)"
      >
        <input
          type="search"
          maxlength="100"
          aria-label="Buscar Persona"
          placeholder="Nombre, apellido o expediente"
          class="siga-focus min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          [value]="searchText()"
          (input)="searchText.set($any($event.target).value)"
        />
        <button
          type="submit"
          class="siga-focus rounded-lg bg-[#611232] px-4 py-2 text-sm font-medium text-white"
          [disabled]="loading()"
        >
          Buscar
        </button>
      </form>

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

      @if (!loading() && !error()) {
        <div class="mt-4 divide-y divide-gray-100">
          @for (person of persons(); track person.id_persona) {
            <div class="flex items-center justify-between gap-3 py-3">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-800">
                  {{ person.nombres }}
                  {{ person.apellido_paterno }}
                  {{ person.apellido_materno }}
                </p>
                <p class="text-xs text-gray-500">
                  Expediente: {{ person.num_expediente }}
                </p>
              </div>
              <button
                type="button"
                class="siga-focus rounded-lg border border-[#611232] px-3 py-1.5 text-xs font-medium text-[#611232]"
                (click)="personSelected.emit(person)"
              >
                Seleccionar
              </button>
            </div>
          } @empty {
            <p class="py-4 text-sm text-gray-500">
              No se encontraron Personas disponibles.
            </p>
          }
        </div>

        <div class="mt-3 flex items-center justify-between gap-3 border-t pt-3">
          <button
            type="button"
            class="text-xs font-medium text-[#611232] disabled:opacity-40"
            [disabled]="page() <= 1"
            (click)="loadPage(page() - 1)"
          >
            Anterior
          </button>
          <span class="text-xs text-gray-600">
            Página {{ page() }} de {{ lastPage() }}
            · {{ total() }} registros
          </span>
          <button
            type="button"
            class="text-xs font-medium text-[#611232] disabled:opacity-40"
            [disabled]="page() >= lastPage()"
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
  readonly persons = signal<AvailablePerson[]>([]);
  readonly page = signal(1);
  readonly lastPage = signal(1);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private currentSearch = "";
  private requestVersion = 0;

  ngOnInit(): void {
    this.loadPage(1);
  }

  search(event: Event): void {
    event.preventDefault();
    this.currentSearch = this.searchText().trim();
    this.loadPage(1);
  }

  loadPage(page: number): void {
    if (
      this.loading() ||
      page < 1 ||
      (page > this.lastPage() && page !== 1)
    ) {
      return;
    }

    const version = ++this.requestVersion;
    this.loading.set(true);
    this.error.set(null);
    this.persons.set([]);

    this.service
      .availablePersons(this.currentSearch, page)
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