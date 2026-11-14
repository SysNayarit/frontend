import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { AuthContextService } from "../../../auth/auth-context.service";

interface RosterRow {
  fila_excel: number;
  numero: number | null;
  matricula: string;
  rfc_mascarado: string;
  nombre_completo: string;
  generacion: string;
  grupo: number | null;
  numero_grupo: number | null;
  estado: "VALIDO" | "OBSERVACION" | "ERROR";
  errores: string[];
  advertencias: string[];
}

interface RosterReport {
  fase: string;
  generacion_detectada: string | null;
  summary: {
    total: number;
    validos: number;
    con_observaciones: number;
    con_errores: number;
    advertencias: number;
  };
  grupos: Record<string, number>;
  filas: RosterRow[];
  conciliacion_personas_realizada: boolean;
  persistido: boolean;
  matriculas_generadas: number;
  usuarios_creados: number;
}

@Component({
  selector: "app-academic-roster-validation",
  standalone: true,
  template: `
    <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 class="text-xl font-semibold text-[#611232]">
        Importación masiva académica
      </h2>

      <p class="mt-2 text-sm text-gray-600">
        Fase 1 de 8. Validación del Excel institucional.
        ID BECARIO corresponde a la matrícula.
        Esta pantalla no registra datos.
      </p>

      @if (!canValidate()) {
        <p role="status" class="mt-4 rounded-lg border p-4 text-amber-900">
          Se requieren los permisos de consulta académica,
          participantes y Personas. No se conceden permisos aquí.
        </p>
      } @else {
        <div class="mt-5 space-y-4">
          <label class="block text-sm font-semibold">
            Archivo Excel (.xlsx)

            <input
              type="file"
              accept=".xlsx"
              [disabled]="busy()"
              (change)="selectFile($event)"
              class="mt-2 block w-full rounded-lg border p-3 text-sm"
            />
          </label>

          @if (file(); as selected) {
            <p class="text-sm text-gray-600">
              Archivo seleccionado: {{ selected.name }}
            </p>
          }

          <button
            type="button"
            (click)="validate()"
            [disabled]="busy() || !file()"
            class="rounded-lg bg-[#611232] px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {{ busy() ? "Validando..." : "Validar archivo Excel" }}
          </button>

          @if (error(); as message) {
            <p role="alert" class="rounded-lg border border-red-200 p-4 text-red-800">
              {{ message }}
            </p>
          }

          @if (report(); as data) {
            <div class="space-y-4">
              <h3 class="text-lg font-bold text-[#611232]">
                Resultado de validación
              </h3>

              <p class="text-sm">
                Generación detectada:
                <strong>{{ data.generacion_detectada }}</strong>
              </p>

              <div class="grid gap-3 sm:grid-cols-4">
                <div class="rounded-lg bg-gray-50 p-4">
                  <p class="text-xs">Total de filas</p>
                  <p class="text-2xl font-bold">{{ data.summary.total }}</p>
                </div>

                <div class="rounded-lg bg-gray-50 p-4">
                  <p class="text-xs">Válidas</p>
                  <p class="text-2xl font-bold">{{ data.summary.validos }}</p>
                </div>

                <div class="rounded-lg bg-gray-50 p-4">
                  <p class="text-xs">Observaciones</p>
                  <p class="text-2xl font-bold">
                    {{ data.summary.con_observaciones }}
                  </p>
                </div>

                <div class="rounded-lg bg-gray-50 p-4">
                  <p class="text-xs">Errores</p>
                  <p class="text-2xl font-bold">
                    {{ data.summary.con_errores }}
                  </p>
                </div>
              </div>

              <h4 class="font-semibold">Distribución por grupo</h4>

              <div class="flex flex-wrap gap-2">
                @for (group of groupEntries(); track group[0]) {
                  <span class="rounded-lg border px-3 py-2 text-sm">
                    Grupo {{ group[0] }}: {{ group[1] }}
                  </span>
                }
              </div>

              <div class="overflow-x-auto">
                <table class="w-full min-w-[950px] text-left text-sm">
                  <thead class="border-b bg-gray-50">
                    <tr>
                      <th class="p-2">Fila</th>
                      <th class="p-2">Matrícula</th>
                      <th class="p-2">RFC protegido</th>
                      <th class="p-2">Nombre completo</th>
                      <th class="p-2">Generación</th>
                      <th class="p-2">Grupo</th>
                      <th class="p-2">Estado</th>
                      <th class="p-2">Observaciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    @for (row of data.filas; track row.fila_excel) {
                      <tr class="border-b">
                        <td class="p-2">{{ row.fila_excel }}</td>
                        <td class="p-2">{{ row.matricula }}</td>
                        <td class="p-2">{{ row.rfc_mascarado }}</td>
                        <td class="p-2">{{ row.nombre_completo }}</td>
                        <td class="p-2">{{ row.generacion }}</td>
                        <td class="p-2">
                          {{ row.grupo }} / {{ row.numero_grupo }}
                        </td>
                        <td class="p-2 font-medium">{{ row.estado }}</td>
                        <td class="p-2">
                          {{
                            row.errores
                              .concat(row.advertencias)
                              .join("; ") || "Sin incidencias"
                          }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <p class="rounded-lg border p-3 text-sm font-semibold">
                Validación solamente.
                Personas y cadetes registrados: 0.
                Matrículas nuevas: 0.
                Usuarios nuevos: 0.
                Conciliación con Persona: pendiente de Fase 2.
              </p>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class AcademicRosterValidationComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthContextService);

  readonly canValidate = computed(() =>
    this.auth.hasPermission("academico.organizacion.ver") &&
    this.auth.hasPermission("academico.participantes.ver") &&
    this.auth.hasPermission("personas.ver")
  );

  readonly file = signal<File | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly report = signal<RosterReport | null>(null);

  readonly groupEntries = computed(() =>
    Object.entries(this.report()?.grupos ?? {})
      .sort((a, b) => Number(a[0]) - Number(b[0]))
  );

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.file.set(input.files?.item(0) ?? null);
    this.report.set(null);
    this.error.set(null);
  }

  validate(): void {
    const selected = this.file();

    if (!selected || this.busy() || !this.canValidate()) {
      return;
    }

    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      this.error.set("Selecciona un archivo .xlsx.");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      this.error.set("El archivo supera el límite de 5 MB.");
      return;
    }

    const form = new FormData();
    form.append("archivo", selected, selected.name);

    this.busy.set(true);
    this.error.set(null);
    this.report.set(null);

    this.http.post<{ data: RosterReport }>(
      "/api/academico/importaciones/validar",
      form
    ).subscribe({
      next: (response) => {
        this.report.set(response.data);
        this.busy.set(false);
      },
      error: (failure: HttpErrorResponse) => {
        this.busy.set(false);

        const validation = failure.error?.errors?.archivo;
        const detail =
          Array.isArray(validation) &&
          typeof validation[0] === "string"
            ? validation[0]
            : null;

        this.error.set(
          failure.status === 401
            ? "Tu sesión no está vigente."
            : failure.status === 403
              ? "No cuentas con los permisos requeridos."
              : failure.status === 419
                ? "La sesión o el token de seguridad expiró."
                : failure.status === 422
                  ? detail ?? "El Excel no es válido."
                  : "No fue posible validar el archivo."
        );
      },
    });
  }
}
