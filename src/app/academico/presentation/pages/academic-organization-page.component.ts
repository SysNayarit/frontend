import { HttpClient } from "@angular/common/http";
import { Component, inject, OnInit, signal } from "@angular/core";
import { forkJoin } from "rxjs";

type AcademicRow = Record<string, string | number | boolean | null>;

interface AcademicResponse {
  data: AcademicRow[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
  };
}

interface Section {
  key: string;
  title: string;
  columns: Array<{ key: string; label: string }>;
}

interface CadetNameParts {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
}

interface CadetExcelRow {
  fila_excel: number;
  nombre_completo: string;
  nombre_desglosado: CadetNameParts | null;
  requiere_revision_nombre: boolean;
  estado: string;
  errores: string[];
  advertencias: string[];
  conciliacion?: {
    estado: string;
  };
}

interface CadetExcelPreview {
  summary: {
    total: number;
    validos: number;
    con_observaciones: number;
    con_errores: number;
    nombres_pendientes_revision: number;
  };
  conciliacion: Record<string, number> | null;
  filas: CadetExcelRow[];
}
// SIGA_ACADEMIA_UI_V1
interface SigaAcademiaExcel {
  codigo_programa: string;
  nombre_programa: string;
  tipo_cohorte: string;
  numero_generacion: number;
  anio_generacion: number | null;
  grupos_iniciales: Array<{
    codigo: string;
    especializacion: string | null;
  }>;
  errores: string[];
  advertencias: string[];
  lista_para_registro: boolean;
}

interface SigaOrganizacionExcel {
  id_programa: string;
  codigo_programa: string;
  id_cohorte: string;
  numero_generacion: number;
  anio_generacion: number;
  cadetes_validados: number;
  grupos: Array<{
    codigo: string;
    id_grupo: string;
    especializacion: string | null;
  }>;
}

// SIGA_CONFIRMAR_CADETES_UI_V1
interface SigaCadetIncorporationResult {
  id_cohorte: string;
  filas_procesadas: number;
  personas_creadas: number;
  personas_reutilizadas: number;
  usuarios_creados: number;
  roles_asignados: number;
}
// SIGA_PREVISUALIZAR_CADETES_V1
interface SigaCadetPreflight {
  estado: "PREVISUALIZADO";
  id_cohorte: string;
  filas_procesadas: number;
  personas_nuevas_previstas: number;
  personas_reutilizables_previstas: number;
  filas: Array<{
    fila_excel: number;
    resultado: string;
  }>;
}

// SIGA_FORMULARIOS_ACADEMICOS_RETIRADOS_V2
// SIGA_PREVALIDACION_ACADEMICA_ELIMINADA_V1
interface SigaPrecheckSinCohorte {
  estado: string;
  filas_procesadas: number;
  resumen: {
    total: number;
    validos: number;
    con_observaciones: number;
    con_errores: number;
    nombres_pendientes_revision: number;
  };
  academia: {
    numero_generacion: number | null;
    anio_generacion: number | null;
    lista_para_registro: boolean;
  };
  grupos: string[];
  conciliacion: Record<string, number> | null;
  errores_academia: string[];
  advertencias_academia: string[];
  filas: Array<{
    fila_excel: number;
    grupo: string;
    estado: string;
    advertencias: string[];
  }>;
  confirmacion_habilitada: boolean;
  persistido: boolean;
}
interface SigaPersonasExcelPreview {
  estado: string;
  resumen: {
    total: number;
    validas: number;
    invalidas: number;
    candidatas_nuevas: number;
    existentes_por_identificador: number;
    duplicadas_en_excel: number;
    sin_rfc_ni_curp: number;
  };
  filas: Array<{
    fila_excel: number;
    estado: string;
    campos_con_error: string[];
  }>;
  persistido: boolean;
  confirmacion_habilitada: boolean;
}
@Component({
  imports: [],
  selector: "app-academic-organization-page",
  standalone: true,
  template: `
    <main class="space-y-6">
      <header class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <p class="text-xs font-semibold uppercase tracking-widest text-[#9b2247]">
          Administración académica
        </p>
        <h1 class="mt-2 text-3xl font-bold text-[#611232]">
          Organización Académica
        </h1>
        <p class="mt-3 text-sm text-gray-600">
          Consulta institucional de programas, generaciones,
          escalones, sedes y grupos.
        </p>
        <button
          type="button"
          (click)="load()"
          [disabled]="loading()"
          class="mt-4 rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Actualizar información
        </button>
      </header>

      <section
        data-testid="siga-cadet-excel-import"
        class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
      >
        <h2 class="text-xl font-bold text-[#611232]">
          Importación de cadetes desde Excel
        </h2>

        <p class="mt-2 text-sm text-gray-600">
          Valida el archivo y revisa nombres y apellidos antes
          de registrar identidades institucionales.
        </p>

        <label for="cadet-excel" class="mt-4 block font-semibold">
          Archivo XLSX
        </label>

        <input
          id="cadet-excel"
          type="file"
          accept=".xlsx"
          [disabled]="cadetRosterLoading()"
          (change)="selectCadetRoster($event)"
          class="mt-2 block w-full rounded-lg border p-3"
        />

        <button data-testid="siga-cadet-validate-button"
          type="button"
          [disabled]="!cadetRosterFile() || cadetRosterLoading()"
          (click)="validateCadetRoster()"
          class="mt-4 rounded-lg bg-[#611232] px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {{
            cadetRosterLoading()
              ? "Validando..."
              : "Validar archivo Excel"
          }}
        </button>

        @if (cadetRosterError()) {
          <p role="alert" class="mt-4 text-sm text-red-700">
            {{ cadetRosterError() }}
          </p>
        }

        @if (cadetRosterPreview(); as preview) {
          <div
            data-testid="siga-personas-excel-preview"
            class="mt-5 rounded-xl border border-[#611232]/20 p-4"
          >
            <h3 class="font-semibold text-[#611232]">
              Registro de Personas desde Excel
            </h3>

            <p class="mt-2 text-sm text-gray-600">
              SIGA analiza las columnas de identidad, comprueba duplicados
              y consulta Personas existentes. Esta revisión no crea
              lotes, Personas ni Usuarios.
            </p>

            <button
              type="button"
              data-testid="siga-personas-preview-button"
              (click)="previsualizarPersonasExcel()"
              [disabled]="personasExcelPreviewLoading() || cadetRosterLoading()"
              class="mt-3 rounded-lg border border-[#611232] px-4 py-2 text-sm font-semibold text-[#611232] disabled:opacity-40"
            >
              {{
                personasExcelPreviewLoading()
                  ? "Consultando Personas..."
                  : "Previsualizar Personas"
              }}
            </button>

            @if (personasExcelPreviewError(); as message) {
              <p role="alert" class="mt-3 text-sm text-red-800">
                {{ message }}
              </p>
            }

            @if (personasExcelPreview(); as result) {
              @if (personasExcelPreviewFile() === cadetRosterFile()) {
                <div role="status" class="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
                  <p class="font-semibold text-[#611232]">
                    Previsualización institucional de Personas
                  </p>

                  <div class="mt-3 grid grid-cols-2 gap-3">
                    <p>Filas analizadas: {{ result.resumen.total }}</p>
                    <p>Válidas: {{ result.resumen.validas }}</p>
                    <p>Inválidas: {{ result.resumen.invalidas }}</p>
                    <p>
                      Candidatas nuevas:
                      {{ result.resumen.candidatas_nuevas }}
                    </p>
                    <p>
                      Personas existentes:
                      {{ result.resumen.existentes_por_identificador }}
                    </p>
                    <p>
                      Duplicadas en Excel:
                      {{ result.resumen.duplicadas_en_excel }}
                    </p>
                    <p>
                      Sin RFC ni CURP:
                      {{ result.resumen.sin_rfc_ni_curp }}
                    </p>
                  </div>

                  <p class="mt-3 font-semibold text-amber-800">
                    Registro definitivo: NO AUTORIZADO desde esta revisión.
                  </p>
                  <p>Personas creadas: 0</p>
                  <p>Usuarios creados: 0</p>
                  <p>Lotes creados: 0</p>
                </div>

                @if (
                  result.resumen.invalidas > 0 ||
                  result.resumen.duplicadas_en_excel > 0 ||
                  result.resumen.existentes_por_identificador > 0 ||
                  result.resumen.sin_rfc_ni_curp > 0
                ) {
                  <div class="mt-4 rounded-lg border p-3 text-sm">
                    <p class="font-semibold">
                      Filas que necesitan revisión
                    </p>

                    @for (row of result.filas; track row.fila_excel) {
                      @if (row.estado !== "CANDIDATA_NUEVA") {
                        <p class="mt-2 border-t pt-2">
                          Fila {{ row.fila_excel }}:
                          {{ row.estado }}
                          @if (row.campos_con_error.length > 0) {
                            ({{ row.campos_con_error.join(", ") }})
                          }
                        </p>
                      }
                    }
                  </div>
                }
              }
            }
          </div>

          <!-- Previsualizacion preliminar del mismo Excel: sin escrituras -->
          <div
            data-testid="siga-precheck-sin-cohorte"
            class="mt-5 rounded-xl border border-[#611232]/20 p-4"
          >
            <h3 class="font-semibold text-[#611232]">
              Previsualización de incorporación sin registrar cohorte
            </h3>
            <p class="mt-2 text-sm text-gray-600">
              Comprueba las filas, los grupos y la conciliación institucional.
              Funciona también con archivos de ejemplo y no crea registros.
              Esta revisión no autoriza el alta real de cadetes.
            </p>

            <button
              type="button"
              data-testid="siga-cadet-precheck-without-cohort"
              (click)="previsualizarCadetesSinCohorte()"
              [disabled]="precheckSinCohorteLoading() || cadetRosterLoading()"
              class="mt-3 rounded-lg border border-[#611232] px-4 py-2 text-sm font-semibold text-[#611232] disabled:opacity-40"
            >
              {{
                precheckSinCohorteLoading()
                  ? "Consultando..."
                  : "Previsualizar sin registrar"
              }}
            </button>

            @if (precheckSinCohorteError(); as message) {
              <p role="alert" class="mt-3 text-sm text-red-800">
                {{ message }}
              </p>
            }

            @if (precheckSinCohorte(); as check) {
              @if (precheckSinCohorteArchivo() === cadetRosterFile()) {
                <div role="status" class="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
                  <p class="font-semibold text-[#611232]">
                    Revisión de solo lectura completada
                  </p>
                  <p>Filas analizadas: {{ check.filas_procesadas }}</p>
                  <p>Filas válidas: {{ check.resumen.validos }}</p>
                  <p>Con observaciones: {{ check.resumen.con_observaciones }}</p>
                  <p>Con errores: {{ check.resumen.con_errores }}</p>
                  <p>
                    Generación: {{ check.academia.numero_generacion }}
                    · Año: {{ check.academia.anio_generacion }}
                  </p>
                  <p>Grupos declarados: {{ check.grupos.join(", ") }}</p>
                  <p class="mt-2 font-semibold">
                    Personas creadas: 0 · Incorporaciones creadas: 0
                  </p>
                  <p class="text-amber-800">
                    Confirmación de altas: NO HABILITADA desde esta revisión.
                  </p>
                </div>

                <div class="mt-4">
                  <h4 class="text-sm font-semibold">Conciliación institucional</h4>
                  @for (entry of precheckSinCohorteConciliacion(); track entry[0]) {
                    <p class="mt-1 text-sm">
                      {{ entry[0] }}: {{ entry[1] }}
                    </p>
                  }
                </div>

                @if (check.resumen.con_observaciones > 0) {
                  <div class="mt-4 rounded-lg border p-3">
                    <h4 class="text-sm font-semibold">
                      Filas que necesitan revisión
                    </h4>
                    @for (row of check.filas; track row.fila_excel) {
                      @if (row.advertencias.length > 0) {
                        <div class="mt-2 border-t pt-2 text-sm">
                          <p>Fila Excel {{ row.fila_excel }} · Grupo {{ row.grupo }}</p>
                          @for (warning of row.advertencias; track $index) {
                            <p class="text-amber-800">{{ warning }}</p>
                          }
                        </div>
                      }
                    }
                  </div>
                }
              }
            }
          </div>


          @if (cadetAcademyInfo(); as academy) {
            <section class="mt-5 rounded-xl border bg-white p-4">
              <h3 class="font-semibold text-[#611232]">
                Organización académica del Excel
              </h3>

              <p class="mt-2 text-sm">
                Programa: {{ academy.nombre_programa }}
                ({{ academy.codigo_programa }})
              </p>

              <p class="mt-1 text-sm">
                Generación: {{ academy.numero_generacion }}
                · Año: {{ academy.anio_generacion ?? "Pendiente" }}
              </p>

              <p class="mt-1 text-sm">
                Grupos iniciales: {{ academy.grupos_iniciales.length }}
              </p>

              @for (group of academy.grupos_iniciales; track group.codigo) {
                <p class="mt-1 text-sm">
                  Grupo {{ group.codigo }}
                  · {{ group.especializacion ?? "Formación inicial, sin perfilación" }}
                </p>
              }

              @for (warning of academy.advertencias; track warning) {
                <p class="mt-2 text-sm text-amber-800">
                  {{ warning }}
                </p>
              }

              @for (error of academy.errores; track error) {
                <p class="mt-2 text-sm text-red-800">
                  {{ error }}
                </p>
              }

              <p class="mt-4 text-xs text-gray-600">
                Esta acción registra o reutiliza el programa, la generación
                y los grupos en SIGA. No incorpora cadetes ni crea cuentas.
                No utilices el archivo de ejemplos ficticios para realizar
                altas institucionales.
              </p>

              <button
                data-testid="siga-academia-organize-button"
                type="button"
                (click)="organizeCadetAcademy()"
                [disabled]="!canOrganizeCadetAcademy() || cadetOrganizeLoading()"
                class="mt-3 rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {{
                  cadetOrganizeLoading()
                    ? "Registrando organización..."
                    : "Registrar organización académica"
                }}
              </button>

              @if (!canOrganizeCadetAcademy()) {
                <p class="mt-2 text-xs text-amber-800">
                  La organización no puede registrarse hasta que
                  el Excel esté completo y validado para formación inicial.
                </p>
              }

              @if (cadetOrganizeError()) {
                <p role="alert" class="mt-3 text-sm text-red-800">
                  {{ cadetOrganizeError() }}
                </p>
              }

              @if (cadetOrganizationResult(); as result) {
                @if (result.file === cadetRosterFile()) {
                  <div role="status" class="mt-3 rounded-lg border p-3 text-sm">
                    <p class="font-semibold text-green-800">
                      Organización académica registrada o reutilizada.
                    </p>
                    <p>Generación: {{ result.numero_generacion }}</p>
                    <p>Año: {{ result.anio_generacion }}</p>
                    <p>Grupos: {{ result.grupos.length }}</p>
                    <p>Cadetes incorporados en esta operación: 0</p>

                    <p class="mt-3 text-xs text-gray-700">
                      El siguiente paso registra Personas y cadetes reales.
                      No crea cuentas de Usuario ni asigna permisos.
                    </p>

                    <button
                      data-testid="siga-cadet-preflight-button"
                      type="button"
                      (click)="previsualizarCadetes()"
                      [disabled]="!canConfirmCadetIncorporation() || cadetPreflightLoading()"
                      class="mt-3 mr-3 rounded-lg border border-[#611232] px-4 py-2 text-sm font-semibold text-[#611232] disabled:opacity-40"
                    >
                      {{
                        cadetPreflightLoading()
                          ? "Previsualizando..."
                          : "Previsualizar incorporación"
                      }}
                    </button>

                    @if (cadetPreflight(); as preflight) {
                      @if (cadetPreflightMatches()) {
                        <div role="status" class="mt-3 border p-3 text-sm">
                          <p class="font-semibold">
                            Previsualización completada sin escrituras
                          </p>
                          <p>Filas analizadas: {{ preflight.filas_procesadas }}</p>
                          <p>Personas nuevas previstas:
                            {{ preflight.personas_nuevas_previstas }}
                          </p>
                          <p>Personas existentes reutilizables:
                            {{ preflight.personas_reutilizables_previstas }}
                          </p>
                          <p>Personas creadas: 0</p>
                          <p>Cadetes incorporados: 0</p>
                        </div>
                      }
                    }

                    <button
                      data-testid="siga-cadet-incorporate-button"
                      type="button"
                      (click)="confirmCadetIncorporation()"
                      [disabled]="!canConfirmCadetIncorporation() || !cadetPreflightMatches() || cadetIncorporationLoading()"
                      class="mt-3 rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                    >
                      {{
                        cadetIncorporationLoading()
                          ? "Incorporando cadetes..."
                          : "Confirmar incorporación de cadetes"
                      }}
                    </button>

                    @if (cadetIncorporationError()) {
                      <p role="alert" class="mt-3 text-sm text-red-800">
                        {{ cadetIncorporationError() }}
                      </p>
                    }

                    @if (cadetIncorporationResult(); as incorporation) {
                      <div role="status" class="mt-4 border-t pt-3">
                        <p class="font-semibold text-green-800">
                          Incorporación confirmada por SIGA
                        </p>
                        <p>Filas procesadas: {{ incorporation.filas_procesadas }}</p>
                        <p>Personas creadas: {{ incorporation.personas_creadas }}</p>
                        <p>Personas reutilizadas: {{ incorporation.personas_reutilizadas }}</p>
                        <p>Usuarios creados: {{ incorporation.usuarios_creados }}</p>
                        <p>Roles asignados: {{ incorporation.roles_asignados }}</p>
                      </div>
                    }
                  </div>
                }
              }
            </section>
          }
          <div class="mt-5 rounded-lg bg-gray-50 p-4 text-sm">
            <p>Total de filas: {{ preview.summary.total }}</p>
            <p>Válidas: {{ preview.summary.validos }}</p>
            <p>Con observaciones:
              {{ preview.summary.con_observaciones }}
            </p>
            <p>Con errores: {{ preview.summary.con_errores }}</p>
            <p class="font-semibold text-amber-800">
              Nombres pendientes de revisión:
              {{ preview.summary.nombres_pendientes_revision }}
            </p>
          </div>

          @if (preview.conciliacion) {
            <div class="mt-4 rounded-lg border p-4 text-sm">
              <h3 class="font-semibold">
                Conciliación institucional
              </h3>

              @for (entry of cadetReconciliation(); track entry[0]) {
                <p>{{ entry[0] }}: {{ entry[1] }}</p>
              }
            </div>
          }

          <div class="mt-5 flex items-center justify-between gap-3">
            <h3 class="font-semibold">Revisión de nombres</h3>

            <button
              type="button"
              (click)="cadetOnlyPending.set(!cadetOnlyPending())"
              class="rounded-lg border px-3 py-2 text-sm"
            >
              {{
                cadetOnlyPending()
                  ? "Mostrar todas"
                  : "Solo pendientes"
              }}
            </button>
          </div>

          <p class="mt-2 text-xs text-gray-600">
            SIGA toma nombres y apellidos directamente de las columnas del Excel.
            Solo los archivos antiguos con nombre completo pueden necesitar revisión.
          </p>

                    <p class="mt-3 text-sm text-gray-700">
            El nombre original del Excel se muestra como referencia.
            Puedes corregir nombres y apellidos en las columnas siguientes.
            Pulsa "Validar archivo Excel" para revisar los cambios.
            Ninguna corrección se guarda en la base institucional
            hasta que se confirme expresamente el alta.
          </p>
<div class="mt-4 max-h-[32rem] overflow-auto rounded-lg border">
            <table class="w-full min-w-[850px] text-left text-sm">
              <thead class="sticky top-0 bg-gray-100">
                <tr>
                  <th scope="col" class="p-3">Fila</th>
                  <th scope="col" class="p-3">Nombre original</th>
                  <th scope="col" class="p-3">Nombres</th>
                  <th scope="col" class="p-3">Apellido paterno</th>
                  <th scope="col" class="p-3">Apellido materno</th>
                  <th scope="col" class="p-3">Resultado</th>
                </tr>
              </thead>

              <tbody>
                @for (row of cadetVisibleRows(); track row.fila_excel) {
                  <tr class="border-t align-top">
                    <td class="p-2">{{ row.fila_excel }}</td>
                    <td class="p-2">{{ row.nombre_completo }}</td>

                    <td class="p-2">
                      <input
                        [attr.aria-label]="'Nombres fila ' + row.fila_excel"
                        [value]="cadetName(row, 'nombres')"
                        (input)="setCadetName(row, 'nombres', $event)"
                        class="w-full rounded border p-2"
                      />
                    </td>

                    <td class="p-2">
                      <input
                        [attr.aria-label]="'Apellido paterno fila ' + row.fila_excel"
                        [value]="cadetName(row, 'apellido_paterno')"
                        (input)="setCadetName(row, 'apellido_paterno', $event)"
                        class="w-full rounded border p-2"
                      />
                    </td>

                    <td class="p-2">
                      <input
                        [attr.aria-label]="'Apellido materno fila ' + row.fila_excel"
                        [value]="cadetName(row, 'apellido_materno')"
                        (input)="setCadetName(row, 'apellido_materno', $event)"
                        class="w-full rounded border p-2"
                      />
                    </td>

                    <td class="p-2">
                      {{ row.estado }}

                      @if (row.requiere_revision_nombre) {
                        <p class="text-amber-800">Nombre pendiente</p>
                      }

                      @for (error of row.errores; track $index) {
                        <p class="text-red-700">{{ error }}</p>
                      }

                      @for (warning of row.advertencias; track $index) {
                        <p class="text-amber-800">{{ warning }}</p>
                      }

                      @if (row.conciliacion) {
                        <p class="text-xs">
                          {{ row.conciliacion.estado }}
                        </p>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="p-4">
                      Sin registros para este filtro.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
      @if (loading()) {
        <p role="status" class="rounded-xl bg-white p-4">
          Consultando información académica...
        </p>
      }

      @if (error()) {
        <p role="alert"
           class="rounded-xl border border-red-200 bg-white p-4 text-red-800">
          {{ error() }}
        </p>
      }

      @if (!loading() && !error()) {
        @for (section of sections; track section.key) {
          <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 class="text-xl font-semibold text-[#611232]">
              {{ section.title }}
            </h2>
            <p class="mt-1 text-sm text-gray-500">
              Total: {{ result(section.key)?.meta?.total ?? 0 }}
            </p>
            <div class="mt-4 overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="border-b bg-gray-50">
                  <tr>
                    @for (column of section.columns; track column.key) {
                      <th scope="col" class="p-3">{{ column.label }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (item of result(section.key)?.data ?? []; track $index) {
                    <tr class="border-b border-gray-100">
                      @for (column of section.columns; track column.key) {
                        <td class="p-3">
                          {{ display(item[column.key]) }}
                        </td>
                      }
                    </tr>
                  } @empty {
                    <tr>
                      <td class="p-4 text-gray-500"
                          [attr.colspan]="section.columns.length">
                        Sin registros.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if ((result(section.key)?.meta?.last_page ?? 1) > 1) {
              <p class="mt-3 text-xs text-gray-500">
                Se muestran los primeros 50 registros.
              </p>
            }
          </section>
        }
      }
              <!-- SIGA_PRECHECK_USABILIDAD_V1 -->

          <!-- SIGA_ACAD_CONFIG_V1 -->
    </main>
  `,
})
export class AcademicOrganizationPageComponent implements OnInit {

  readonly cadetPreflightLoading = signal(false);
  readonly cadetPreflight = signal<
    (SigaCadetPreflight & { file: File }) | null
  >(null);

  readonly cadetIncorporationLoading = signal(false);
  readonly cadetIncorporationError = signal<string | null>(null);
  readonly cadetIncorporationResult =
    signal<SigaCadetIncorporationResult | null>(null);


  readonly cadetOrganizeLoading = signal(false);
  readonly cadetOrganizeError = signal<string | null>(null);

  readonly cadetOrganizationResult = signal<
    (SigaOrganizacionExcel & { file: File }) | null
  >(null);

  private readonly http = inject(HttpClient);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly records = signal<Record<string, AcademicResponse>>({});

  readonly sections: Section[] = [
    {
      key: "programas",
      title: "Programas académicos",
      columns: [
        { key: "codigo", label: "Código" },
        { key: "nombre", label: "Nombre" },
      ],
    },
    {
      key: "cohortes",
      title: "Generaciones y escalones",
      columns: [
        { key: "tipo", label: "Tipo (G/E)" },
        { key: "numero", label: "Número" },
        { key: "anio", label: "Año" },
      ],
    },
    {
      key: "sedes",
      title: "Sedes",
      columns: [
        { key: "codigo", label: "Código" },
        { key: "nombre", label: "Nombre" },
        { key: "activa", label: "Activa" },
      ],
    },
    {
      key: "grupos",
      title: "Grupos",
      columns: [
        { key: "codigo", label: "Código" },
        { key: "especializacion", label: "Especialización" },
        { key: "id_cohorte", label: "Generación/escalón" },
      ],
    },
  ];

  readonly cadetRosterFile = signal<File | null>(null);
  readonly cadetRosterPreview = signal<CadetExcelPreview | null>(null);
  readonly cadetRosterLoading = signal(false);
  readonly cadetRosterError = signal<string | null>(null);
  readonly cadetOnlyPending = signal(false);
  readonly cadetCorrections = signal<Record<number, CadetNameParts>>({});

  selectCadetRoster(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.cadetRosterFile.set(file);
    this.cadetRosterPreview.set(null);
    this.cadetCorrections.set({});
    this.cadetRosterError.set(null);
  }

  cadetName(row: CadetExcelRow, field: keyof CadetNameParts): string {
    return this.cadetCorrections()[row.fila_excel]?.[field]
      ?? row.nombre_desglosado?.[field]
      ?? "";
  }

  setCadetName(
    row: CadetExcelRow,
    field: keyof CadetNameParts,
    event: Event
  ): void {
    const previous = this.cadetCorrections()[row.fila_excel] ?? {
      nombres: row.nombre_desglosado?.nombres ?? "",
      apellido_paterno: row.nombre_desglosado?.apellido_paterno ?? "",
      apellido_materno: row.nombre_desglosado?.apellido_materno ?? "",
    };

    this.cadetCorrections.update((items) => ({
      ...items,
      [row.fila_excel]: {
        ...previous,
        [field]: (event.target as HTMLInputElement).value,
      },
    }));
  }

  cadetVisibleRows(): CadetExcelRow[] {
    const rows = this.cadetRosterPreview()?.filas ?? [];

    return this.cadetOnlyPending()
      ? rows.filter((row) => row.requiere_revision_nombre)
      : rows;
  }

  cadetReconciliation(): Array<[string, number]> {
    return Object.entries(this.cadetRosterPreview()?.conciliacion ?? {});
  }

  validateCadetRoster(): void {
    const file = this.cadetRosterFile();

    if (!file || this.cadetRosterLoading()) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      this.cadetRosterError.set("Selecciona un archivo XLSX.");
      return;
    }

    const corrections = Object.entries(this.cadetCorrections());

    for (const [rowNumber, parts] of corrections) {
      if (
        !parts.nombres.trim() ||
        (
          !parts.apellido_paterno.trim() &&
          !parts.apellido_materno.trim()
        )
      ) {
        this.cadetRosterError.set(
          `Completa nombres y al menos un apellido de la fila ${rowNumber}.`
        );
        return;
      }
    }

    const form = new FormData();
    form.append("archivo", file);

    corrections.forEach(([number, parts], index) => {
      const prefix = `desgloses[${index}]`;

      form.append(`${prefix}[fila_excel]`, number);
      form.append(`${prefix}[nombres]`, parts.nombres);
      form.append(`${prefix}[apellido_paterno]`, parts.apellido_paterno);
      form.append(`${prefix}[apellido_materno]`, parts.apellido_materno);
    });

    this.cadetPreflight.set(null);
    this.cadetOrganizationResult.set(null);
    this.cadetIncorporationResult.set(null);
    this.cadetIncorporationError.set(null);
    this.cadetRosterLoading.set(true);
    this.cadetRosterError.set(null);

    this.http.post<{ data: CadetExcelPreview }>(
      "/api/academico/importaciones/validar",
      form
    ).subscribe({
      next: (response) => {
        this.cadetRosterPreview.set(response.data);
        this.cadetRosterLoading.set(false);
      },
      error: (error) => {
        const status = Number(error?.status ?? 0);
        const errors = error?.error?.errors;

        const messages: string[] =
          errors && typeof errors === "object"
            ? Object.values(errors)
                .flat()
                .filter((value): value is string => typeof value === "string")
            : [];

        const serverMessage =
          typeof error?.error?.message === "string"
            ? error.error.message
            : "";

        const explanation =
          status === 0
            ? "No hay conexion con el servidor Backend."
            : status === 401
              ? "La sesion no es valida. Inicia sesion nuevamente."
              : status === 403
                ? "El Usuario no tiene permiso para validar el Excel."
                : status === 419
                  ? "La sesion o el token de seguridad caducaron."
                  : status === 413
                    ? "El archivo supera el limite de carga."
                    : status === 422
                      ? "El servidor rechazo los datos del archivo."
                      : status >= 500
                        ? "El servidor genero un error interno."
                        : "La validacion no pudo completarse.";

        this.cadetRosterError.set(
          `HTTP ${status}: ${explanation}` +
          (messages[0] ? ` Detalle: ${messages[0]}` :
           serverMessage ? ` Detalle: ${serverMessage}` : "")
        );

        this.cadetRosterLoading.set(false);
      },
    });
  }
  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      programas: this.http.get<AcademicResponse>(
        "/api/academico/programas?per_page=50"
      ),
      cohortes: this.http.get<AcademicResponse>(
        "/api/academico/cohortes?per_page=50"
      ),
      sedes: this.http.get<AcademicResponse>(
        "/api/academico/sedes?per_page=50"
      ),
      grupos: this.http.get<AcademicResponse>(
        "/api/academico/grupos?per_page=50"
      ),
    }).subscribe({
      next: (data) => {
        this.records.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          "No fue posible consultar los catálogos. " +
          "Verifica tu sesión y permisos institucionales."
        );
        this.loading.set(false);
      },
    });
  }

  result(key: string): AcademicResponse | undefined {
    return this.records()[key];
  }

  display(value: AcademicRow[string] | undefined): string {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    if (typeof value === "boolean") {
      return value ? "Sí" : "No";
    }
    return String(value);
  }
  cadetAcademyInfo(): SigaAcademiaExcel | null {
    const preview = this.cadetRosterPreview() as unknown as
      { academia?: SigaAcademiaExcel } | null;

    return preview?.academia ?? null;
  }

  // SIGA_FORMACION_INICIAL_CONTRATO_V1
  canOrganizeCadetAcademy(): boolean {
    const academy = this.cadetAcademyInfo();

    const preview = this.cadetRosterPreview() as unknown as {
      summary?: {
        con_errores: number;
        nombres_pendientes_revision: number;
      };
      filas?: Array<{
        errores?: string[];
        requiere_revision_nombre?: boolean;
        momento_academico?: string;
        generacion?: string;
        grupo?: number | string;
      }>;
    } | null;

    const file = this.cadetRosterFile();

    if (
      !file ||
      !academy ||
      !preview ||
      academy.lista_para_registro !== true ||
      academy.anio_generacion === null ||
      academy.errores.length !== 0 ||
      academy.advertencias.length !== 0 ||
      preview.summary?.con_errores !== 0 ||
      preview.summary?.nombres_pendientes_revision !== 0 ||
      !preview.filas?.length ||
      !academy.grupos_iniciales.length
    ) {
      return false;
    }

    const groups = new Set(
      academy.grupos_iniciales.map(group => group.codigo)
    );

    if (
      academy.grupos_iniciales.some(
        group => group.especializacion !== null
      )
    ) {
      return false;
    }

    return preview.filas.every(row => {
      const generation = String(row.generacion ?? "")
        .toUpperCase()
        .replace(/\s+/g, "");

      const match = generation.match(
        /^0*([0-9]{1,3})[A-Z]{0,4}$/
      );

      return (
        (row.errores?.length ?? 0) === 0 &&
        row.requiere_revision_nombre !== true &&
        groups.has(String(row.grupo ?? "")) &&
        match !== null &&
        Number(match[1]) === academy.numero_generacion
      );
    });
  }

  organizeCadetAcademy(): void {
    const file = this.cadetRosterFile();
    const academy = this.cadetAcademyInfo();

    if (
      !file ||
      !academy ||
      !this.canOrganizeCadetAcademy() ||
      this.cadetOrganizeLoading()
    ) {
      return;
    }

    const message =
      `Archivo: ${file.name}\n` +
      `Programa: ${academy.codigo_programa}\n` +
      `Generación: ${academy.numero_generacion}\n` +
      `Año: ${academy.anio_generacion}\n` +
      `Grupos: ${academy.grupos_iniciales.length}\n\n` +
      "Esta operación registrará o reutilizará la organización " +
      "académica en la base institucional siga.\n\n" +
      "No crea Personas, Usuarios ni cadetes.\n\n" +
      "¿Confirmas que el archivo corresponde a información " +
      "institucional real y autorizas esta operación?";

    if (!window.confirm(message)) {
      return;
    }

    const form = new FormData();
    form.append("archivo", file, file.name);

    this.cadetPreflight.set(null);
    this.cadetIncorporationResult.set(null);
    this.cadetIncorporationError.set(null);
    this.cadetOrganizeLoading.set(true);
    this.cadetOrganizeError.set(null);
    this.cadetOrganizationResult.set(null);

    this.http.post<{ data: SigaOrganizacionExcel }>(
      "/api/academico/importaciones/organizar",
      form
    ).subscribe({
      next: response => {
        const result = response.data;

        if (
          !result ||
          !result.id_programa ||
          !result.id_cohorte ||
          !Array.isArray(result.grupos)
        ) {
          this.cadetOrganizeError.set(
            "El servidor no devolvió los identificadores académicos esperados."
          );
          this.cadetOrganizeLoading.set(false);
          return;
        }

        this.cadetOrganizationResult.set({
          ...result,
          file,
        });

        this.cadetOrganizeLoading.set(false);
        this.load();
      },
      error: error => {
        const status = Number(error?.status ?? 0);

        const details = error?.error?.errors;

        const specificMessage =
          details && typeof details === "object"
            ? Object.values(details)
                .flat()
                .find((item): item is string =>
                  typeof item === "string"
                )
            : undefined;

        this.cadetOrganizeError.set(
          `HTTP ${status}: ` +
          (
            specificMessage ??
            error?.error?.message ??
            "No fue posible registrar la organización académica."
          )
        );

        this.cadetOrganizeLoading.set(false);
      },
    });
  }

  cadetPreflightMatches(): boolean {
    const file = this.cadetRosterFile();
    const organization = this.cadetOrganizationResult();
    const preview = this.cadetRosterPreview();
    const check = this.cadetPreflight();

    return Boolean(
      file &&
      organization &&
      preview &&
      check &&
      check.estado === "PREVISUALIZADO" &&
      check.file === file &&
      check.id_cohorte === organization.id_cohorte &&
      check.filas_procesadas === preview.summary.total &&
      check.personas_nuevas_previstas >= 0 &&
      check.personas_reutilizables_previstas >= 0 &&
      check.personas_nuevas_previstas +
        check.personas_reutilizables_previstas ===
        check.filas_procesadas
    );
  }

  // SIGA_PREVIEW_SIN_COHORTE_UI_V1
  readonly precheckSinCohorte = signal<SigaPrecheckSinCohorte | null>(null);
  readonly precheckSinCohorteArchivo = signal<File | null>(null);
  readonly precheckSinCohorteLoading = signal(false);
  readonly precheckSinCohorteError = signal<string | null>(null);

  precheckSinCohorteConciliacion(): Array<[string, number]> {
    return Object.entries(this.precheckSinCohorte()?.conciliacion ?? {});
  }

  previsualizarCadetesSinCohorte(): void {
    const file = this.cadetRosterFile();

    if (
      !file ||
      !this.cadetRosterPreview() ||
      this.cadetRosterLoading() ||
      this.precheckSinCohorteLoading()
    ) {
      return;
    }

    this.precheckSinCohorte.set(null);
    this.precheckSinCohorteArchivo.set(null);
    this.precheckSinCohorteError.set(null);
    this.precheckSinCohorteLoading.set(true);

    const form = new FormData();
    form.append("archivo", file, file.name);
    form.append("modo", "PREVISUALIZAR");

    this.http.post<{ data: SigaPrecheckSinCohorte }>(
      "/api/academico/importaciones/incorporar",
      form
    ).subscribe({
      next: response => {
        this.precheckSinCohorteLoading.set(false);

        if (this.cadetRosterFile() !== file) {
          return;
        }

        const result = response.data;

        if (
          result?.estado !== "PREVISUALIZADO_SIN_COHORTE" ||
          result.filas_procesadas !==
            this.cadetRosterPreview()?.summary.total ||
          result.confirmacion_habilitada !== false ||
          result.persistido !== false
        ) {
          this.precheckSinCohorteError.set(
            "La respuesta no cumple el contrato de solo lectura."
          );
          return;
        }

        this.precheckSinCohorteArchivo.set(file);
        this.precheckSinCohorte.set(result);
      },
      error: error => {
        this.precheckSinCohorteLoading.set(false);

        if (this.cadetRosterFile() !== file) {
          return;
        }

        const detail =
          error?.error?.errors?.archivo?.[0] ??
          error?.error?.message ??
          "No fue posible completar la previsualización.";

        this.precheckSinCohorteError.set(
          `HTTP ${Number(error?.status ?? 0)}: ${String(detail)}`
        );
      }
    });
  }
  // SIGA_PERSONAS_PREVIEW_EXCEL_UI_V1
  readonly personasExcelPreview = signal<SigaPersonasExcelPreview | null>(null);
  readonly personasExcelPreviewFile = signal<File | null>(null);
  readonly personasExcelPreviewLoading = signal(false);
  readonly personasExcelPreviewError = signal<string | null>(null);

  previsualizarPersonasExcel(): void {
    const file = this.cadetRosterFile();
    const current = this.cadetRosterPreview();

    if (
      !file ||
      !current ||
      this.cadetRosterLoading() ||
      this.personasExcelPreviewLoading()
    ) {
      return;
    }

    this.personasExcelPreview.set(null);
    this.personasExcelPreviewFile.set(null);
    this.personasExcelPreviewError.set(null);
    this.personasExcelPreviewLoading.set(true);

    const form = new FormData();
    form.append("archivo", file, file.name);
    form.append("modo", "PREVISUALIZAR");

    this.http.post<{ data: SigaPersonasExcelPreview }>(
      "/api/personas/importaciones",
      form
    ).subscribe({
      next: response => {
        this.personasExcelPreviewLoading.set(false);

        if (this.cadetRosterFile() !== file) {
          return;
        }

        const data = response.data;
        const totals = data?.resumen;

        if (
          data?.estado !== "PERSONAS_PREVISUALIZADAS" ||
          data.persistido !== false ||
          data.confirmacion_habilitada !== false ||
          !totals ||
          totals.total !== current.summary.total ||
          totals.validas + totals.invalidas !== totals.total ||
          !Array.isArray(data.filas) ||
          data.filas.length !== totals.total
        ) {
          this.personasExcelPreviewError.set(
            "SIGA devolvió una previsualización de Personas inconsistente."
          );
          return;
        }

        this.personasExcelPreviewFile.set(file);
        this.personasExcelPreview.set(data);
      },
      error: error => {
        this.personasExcelPreviewLoading.set(false);

        if (this.cadetRosterFile() !== file) {
          return;
        }

        const errors = error?.error?.errors;

        const detail =
          errors && typeof errors === "object"
            ? Object.values(errors)
                .flat()
                .find((item): item is string =>
                  typeof item === "string"
                )
            : undefined;

        this.personasExcelPreviewError.set(
          `HTTP ${Number(error?.status ?? 0)}: ${
            detail ??
            error?.error?.message ??
            "No fue posible consultar las Personas."
          }`
        );
      }
    });
  }
  previsualizarCadetes(): void {
    if (
      !this.canConfirmCadetIncorporation() ||
      this.cadetPreflightLoading()
    ) {
      return;
    }

    const file = this.cadetRosterFile();
    const organization = this.cadetOrganizationResult();

    if (!file || !organization) {
      return;
    }

    const form = new FormData();
    form.append("archivo", file, file.name);
    form.append("id_cohorte", organization.id_cohorte);
    form.append("modo", "PREVISUALIZAR");

    this.cadetPreflight.set(null);
    this.cadetPreflightLoading.set(true);
    this.cadetIncorporationError.set(null);

    this.http.post<{ data: SigaCadetPreflight }>(
      "/api/academico/importaciones/incorporar",
      form
    ).subscribe({
      next: response => {
        const result = response.data;

        if (
          result?.estado === "PREVISUALIZADO" &&
          result.id_cohorte === organization.id_cohorte &&
          Array.isArray(result.filas) &&
          result.filas.length === result.filas_procesadas &&
          result.personas_nuevas_previstas +
            result.personas_reutilizables_previstas ===
            result.filas_procesadas
        ) {
          this.cadetPreflight.set({ ...result, file });
        } else {
          this.cadetIncorporationError.set(
            "La previsualización devolvió datos inconsistentes."
          );
        }

        this.cadetPreflightLoading.set(false);
      },
      error: error => {
        const status = Number(error?.status ?? 0);
        const errors = error?.error?.errors;

        const detail =
          errors && typeof errors === "object"
            ? Object.values(errors)
                .flat()
                .find((value): value is string =>
                  typeof value === "string"
                )
            : undefined;

        this.cadetIncorporationError.set(
          `HTTP ${status}: ` +
          (detail ??
            error?.error?.message ??
            "No se pudo previsualizar la incorporación.")
        );

        this.cadetPreflightLoading.set(false);
      },
    });
  }
  canConfirmCadetIncorporation(): boolean {
    const file = this.cadetRosterFile();
    const organization = this.cadetOrganizationResult();
    const academy = this.cadetAcademyInfo();
    const preview = this.cadetRosterPreview();

    if (
      !file ||
      !organization ||
      organization.file !== file ||
      !academy ||
      !preview ||
      !this.canOrganizeCadetAcademy() ||
      this.cadetRosterLoading() ||
      this.cadetOrganizeLoading() ||
      this.cadetIncorporationLoading()
    ) {
      return false;
    }

    // Impide utilizar las plantillas ficticias del desarrollo.
    if (/ejempl|fictici|plantilla|demo|prueba/i.test(file.name)) {
      return false;
    }

    if (
      !organization.id_cohorte ||
      organization.codigo_programa !== academy.codigo_programa ||
      organization.numero_generacion !== academy.numero_generacion ||
      organization.anio_generacion !== academy.anio_generacion ||
      organization.cadetes_validados !== preview.summary.total
    ) {
      return false;
    }

    const groups = new Map(
      organization.grupos.map(group => [group.codigo, group])
    );

    return academy.grupos_iniciales.every(group => {
      const registered = groups.get(group.codigo);

      return (
        registered !== undefined &&
        Boolean(registered.id_grupo) &&
        registered.especializacion === null
      );
    });
  }

  confirmCadetIncorporation(): void {
    if (!this.canConfirmCadetIncorporation() || !this.cadetPreflightMatches()) {
      return;
    }

    const file = this.cadetRosterFile();
    const organization = this.cadetOrganizationResult();
    const preview = this.cadetRosterPreview();

    if (!file || !organization || !preview) {
      return;
    }

    const message =
      `SIGA — INCORPORACION DE CADETES REALES\n\n` +
      `Archivo: ${file.name}\n` +
      `Filas: ${preview.summary.total}\n` +
      `Generacion: ${organization.numero_generacion}\n` +
      `Anio: ${organization.anio_generacion}\n` +
      `Grupos: ${organization.grupos.length}\n\n` +
      `La operacion puede crear Personas institucionales, ` +
      `participantes academicos e incorporaciones con matricula.\n\n` +
      `No utilizara los 20 ejemplos ficticios.\n` +
      `No creara Usuarios ni asignara permisos.\n\n` +
      `¿Confirmas que son cadetes reales y autorizas el registro en SIGA?`;

    if (!window.confirm(message)) {
      return;
    }

    const form = new FormData();

    form.append("archivo", file, file.name);
    form.append("id_cohorte", organization.id_cohorte);
    form.append("modo", "CONFIRMAR");
    form.append("confirmacion", "INCORPORAR_CADETES_REALES");

    this.cadetIncorporationLoading.set(true);
    this.cadetIncorporationError.set(null);
    this.cadetIncorporationResult.set(null);

    this.http.post<{ data: SigaCadetIncorporationResult }>(
      "/api/academico/importaciones/incorporar",
      form
    ).subscribe({
      next: response => {
        const result = response.data;

        if (
          !result ||
          result.id_cohorte !== organization.id_cohorte ||
          result.filas_procesadas !== preview.summary.total ||
          !Number.isInteger(result.personas_creadas) ||
          !Number.isInteger(result.personas_reutilizadas) ||
          result.personas_creadas < 0 ||
          result.personas_reutilizadas < 0 ||
          result.personas_creadas + result.personas_reutilizadas
            !== result.filas_procesadas
        ) {
          this.cadetIncorporationError.set(
            "El servidor respondió, pero no pudo verificarse el resultado. " +
            "No vuelvas a enviar el archivo hasta conciliar las incorporaciones."
          );
        } else {
          this.cadetIncorporationResult.set(result);
          this.load();
        }

        this.cadetIncorporationLoading.set(false);
      },
      error: error => {
        const status = Number(error?.status ?? 0);
        const errors = error?.error?.errors;

        const detail =
          errors && typeof errors === "object"
            ? Object.values(errors)
                .flat()
                .find((value): value is string =>
                  typeof value === "string"
                )
            : undefined;

        const fallback =
          status === 401
            ? "La sesión no está autenticada."
            : status === 403
              ? "Falta un permiso o una reautenticación reciente."
              : status === 419
                ? "La sesión o el token de seguridad caducó."
                : status === 422
                  ? "El archivo requiere revisión institucional."
                  : status === 0
                    ? "No se recibió respuesta del Backend. Verifica el resultado antes de reintentar."
                    : "No pudo confirmarse el resultado. Revisa la respuesta del Backend antes de reintentar.";

        this.cadetIncorporationError.set(
          `HTTP ${status}: ${detail ?? fallback}`
        );

        this.cadetIncorporationLoading.set(false);
      },
    });
  }

}