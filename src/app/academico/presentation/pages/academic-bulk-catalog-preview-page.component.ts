import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

interface CatalogRow {
  fila_excel: number;
  estado: string;
  errores: string[];
  observaciones: string[];
  clave_original?: string;
  asignatura?: string;
  nombre_original?: string;
  id_origen?: string;
}

interface CatalogPreview {
  tipo: "MATERIAS" | "FORMADORES";
  resumen: {
    total: number;
    validas: number;
    con_observaciones: number;
    con_errores: number;
    duplicadas: number;
  };
  filas: CatalogRow[];
  persistido: boolean;
  confirmacion_habilitada: boolean;
}

import { AcademicTrainersNavigationComponent } from "../components/academic-trainers-navigation.component";
@Component({
  selector: "app-academic-bulk-catalog-preview-page",
  standalone: true,
  imports: [RouterLink, AcademicTrainersNavigationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-6xl space-y-6 px-4 py-6">
      @if (!isMaterias) {
        <app-academic-trainers-navigation />
      }
      <header class="space-y-3">
        <a
          [routerLink]="isMaterias ? '/academico/organizacion' : '/academico/formadores'"
          class="text-sm font-semibold text-[#611232] underline"
        >
          Volver al módulo académico
        </a>

        <h1 class="text-2xl font-bold text-[#611232]">
          Validación masiva de {{ isMaterias ? "materias" : "formadores" }}
        </h1>

        <p class="text-sm text-gray-700">
          Selecciona el archivo institucional. SIGA revisará los datos
          necesarios sin registrar ni modificar información.
        </p>
      </header>

      <section class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <label for="siga-catalog-xlsx" class="block text-sm font-semibold">
          Archivo Excel (.xlsx)
        </label>

        <input
          id="siga-catalog-xlsx"
          data-testid="siga-catalog-xlsx"
          type="file"
          accept=".xlsx"
          (change)="selectFile($event)"
          class="block w-full rounded-lg border border-gray-300 p-3 text-sm"
        />

        <button
          type="button"
          data-testid="siga-catalog-validate"
          [disabled]="!file() || loading()"
          (click)="validate()"
          class="rounded-xl bg-[#611232] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ loading() ? "Validando archivo..." : "Validar archivo Excel" }}
        </button>

        @if (error()) {
          <p role="alert" class="rounded-lg border border-red-300 p-3 text-sm text-red-800">
            {{ error() }}
          </p>
        }
      </section>

      @if (result(); as preview) {
        <section
          data-testid="siga-catalog-results"
          class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 class="text-lg font-bold text-[#611232]">
            Resultado de la validación
          </h2>

          <div class="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <p>Total: <strong>{{ preview.resumen.total }}</strong></p>
            <p>Válidos: <strong>{{ preview.resumen.validas }}</strong></p>
            <p>Revisión: <strong>{{ preview.resumen.con_observaciones }}</strong></p>
            <p>Errores: <strong>{{ preview.resumen.con_errores }}</strong></p>
            <p>Duplicados: <strong>{{ preview.resumen.duplicadas }}</strong></p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[650px] border-collapse text-left text-sm">
              <thead class="border-b border-gray-300 bg-gray-50">
                <tr>
                  <th class="p-3">Fila</th>
                  <th class="p-3">{{ isMaterias ? "Materia" : "Formador" }}</th>
                  <th class="p-3">Clave / referencia</th>
                  <th class="p-3">Estado</th>
                  <th class="p-3">Observaciones</th>
                </tr>
              </thead>

              <tbody>
                @for (row of preview.filas; track row.fila_excel) {
                  <tr class="border-b border-gray-200">
                    <td class="p-3">{{ row.fila_excel }}</td>
                    <td class="p-3">
                      {{ isMaterias ? row.asignatura : row.nombre_original }}
                    </td>
                    <td class="p-3">
                      {{ isMaterias ? row.clave_original : row.id_origen }}
                    </td>
                    <td class="p-3">{{ row.estado }}</td>
                    <td class="p-3">
                      {{ row.errores.concat(row.observaciones).join("; ") || "Sin observaciones" }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <p class="border-t border-gray-200 pt-4 text-sm text-gray-700">
            Vista previa únicamente. No se han creado Personas, materias,
            formadores, asignaciones ni evaluaciones.
            El registro masivo definitivo aún no está habilitado.
          </p>
        </section>
      }
    </main>
  `,
})
export class AcademicBulkCatalogPreviewPageComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly isMaterias = this.route.snapshot.data["catalogo"] === "materias";
  readonly file = signal<File | null>(null);
  readonly loading = signal(false);
  readonly error = signal("");
  readonly result = signal<CatalogPreview | null>(null);

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.item(0) ?? null;

    this.file.set(null);
    this.result.set(null);
    this.error.set("");

    if (selected && !selected.name.toLowerCase().endsWith(".xlsx")) {
      this.error.set("Selecciona un archivo Excel .xlsx.");
      return;
    }

    this.file.set(selected);
  }

  validate(): void {
    const selected = this.file();

    if (!selected || this.loading()) {
      return;
    }

    const payload = new FormData();
    payload.append("archivo", selected, selected.name);

    const catalog = this.isMaterias ? "materias" : "formadores";

    this.loading.set(true);
    this.error.set("");
    this.result.set(null);

    this.http
      .post<{ data: CatalogPreview }>(
        `/api/academico/importaciones/${catalog}/validar`,
        payload,
      )
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (response) => {
          this.result.set(response.data);
          this.loading.set(false);
        },
        error: (response: HttpErrorResponse) => {
          const body = response.error;
          const validationMessage = body?.errors?.archivo?.[0];

          this.error.set(
            typeof validationMessage === "string"
              ? validationMessage
              : typeof body?.message === "string"
                ? body.message
                : "No fue posible validar el Excel.",
          );

          this.loading.set(false);
        },
      });
  }
}