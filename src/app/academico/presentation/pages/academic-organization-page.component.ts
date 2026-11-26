import { AcademicOrganizationNavigationComponent } from "../components/academic-organization-navigation.component";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "../../../auth/auth.service";
import { Component, inject, OnInit, signal } from "@angular/core";
import { firstValueFrom, forkJoin, switchMap } from "rxjs";

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
  grupo?: string | number;
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
  usuarios_nuevos_previstos: number;
  filas_sin_correo_para_cuenta: number;
  filas: Array<{
    fila_excel: number;
    resultado: string;
    cuenta_pendiente_correo: boolean;
    usuario_nuevo_previsto: boolean;
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
  imports: [AcademicOrganizationNavigationComponent],
  selector: "app-academic-organization-page",
  standalone: true,
  template: `
    <main class="space-y-6">
        <app-academic-organization-navigation />
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
          Selecciona el archivo. SIGA validará los datos
          y consultará automáticamente los registros institucionales.
        </p>

        <label for="cadet-excel" class="mt-4 block font-semibold">
          Archivo Excel (.xlsx)
        </label>

        <input
          id="cadet-excel"
          type="file"
          accept=".xlsx"
          [disabled]="cadetRosterLoading()"
          (change)="selectCadetRoster($event)"
          class="mt-2 block w-full rounded-lg border p-3"
        />

        <button
          data-testid="siga-cadet-validate-button"
          type="button"
          (click)="validateCadetRoster()"
          [disabled]="!cadetRosterFile() || cadetRosterLoading() || cadetExistingLookupLoading() || cadetPreflightLoading()"
          class="mt-4 rounded-lg bg-[#611232] px-5 py-3 font-semibold text-white disabled:opacity-40"
        >
          {{ cadetRosterLoading() ? "Validando..." : "Validar archivo Excel" }}
        </button>

        @if (cadetRosterError(); as message) {
          <p role="alert" class="mt-3 text-sm text-red-800">
            {{ message }}
          </p>
        }

        @if (cadetRosterPreview(); as report) {
          <div class="mt-5 space-y-4">
            <h3 class="text-lg font-semibold text-[#611232]">
              Resultado de validación
            </h3>

            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div class="rounded-lg bg-gray-50 p-3">
                <p class="text-xs">Registros encontrados</p>
                <p class="text-2xl font-bold">
                  {{ report.summary.total }}
                </p>
              </div>

              <div class="rounded-lg bg-gray-50 p-3">
                <p class="text-xs">Sin observaciones</p>
                <p class="text-2xl font-bold">
                  {{ report.summary.validos }}
                </p>
              </div>

              <div class="rounded-lg bg-gray-50 p-3">
                <p class="text-xs">Con observaciones</p>
                <p class="text-2xl font-bold">
                  {{ report.summary.con_observaciones }}
                </p>
              </div>

              <div class="rounded-lg bg-gray-50 p-3">
                <p class="text-xs">Con errores</p>
                <p class="text-2xl font-bold">
                  {{ report.summary.con_errores }}
                </p>
              </div>
            </div>

            @if (cadetExistingLookupLoading() || cadetPreflightLoading()) {
              <p role="status" class="text-sm text-gray-700">
                Comprobando organización, Personas y Usuarios...
              </p>
            }

            @if (cadetExistingLookupError(); as message) {
              <p role="alert" class="text-sm text-amber-800">
                {{ message }}
              </p>
            }

            @if (cadetIncorporationError(); as message) {
              <p role="alert" class="text-sm text-red-800">
                {{ message }}
              </p>
            }

            @if (cadetPreflightMatches()) {
              <div class="rounded-lg border p-4 text-sm">
                <h4 class="font-semibold text-[#611232]">
                  Resultado institucional
                </h4>

                <p class="mt-2">
                  Aptos preliminares:
                  <strong>{{ cadetReadyRows() }}</strong>
                </p>

                <p>
                  No aptos o pendientes:
                  <strong>
                    {{ report.summary.total - cadetReadyRows() }}
                  </strong>
                </p>

                <p>
                  Personas nuevas previstas:
                  {{ cadetPreflight()?.personas_nuevas_previstas }}
                </p>

                <p>
                  Personas reutilizables:
                  {{ cadetPreflight()?.personas_reutilizables_previstas }}
                </p>

                <p>
                  Usuarios nuevos previstos:
                  {{ cadetPreflight()?.usuarios_nuevos_previstos }}
                </p>

                <p>
                  Filas sin correo institucional:
                  {{ cadetPreflight()?.filas_sin_correo_para_cuenta }}
                </p>

                @if (!cadetAccountsReady()) {
                  <p role="alert" class="mt-3 font-semibold text-amber-800">
                    No se puede registrar este lote mientras existan
                    cuentas institucionales pendientes.
                  </p>
                }
              </div>
            }

            @if (
              !cadetExistingLookupLoading() &&
              !cadetPreflightLoading() &&
              !cadetPreflightMatches()
            ) {
              <p class="text-sm text-amber-800">
                La validación del Excel está disponible,
                pero la conciliación institucional completa
                todavía no está confirmada.
              </p>
            }

            <div class="overflow-auto rounded-lg border">
              <table class="w-full min-w-[750px] text-left text-sm">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="p-3">Fila</th>
                    <th class="p-3">Cadete</th>
                    <th class="p-3">Grupo</th>
                    <th class="p-3">Estado</th>
                    <th class="p-3">Motivos y observaciones</th>
                  </tr>
                </thead>

                <tbody>
                  @for (row of report.filas; track row.fila_excel) {
                    <tr class="border-t align-top">
                      <td class="p-3">{{ row.fila_excel }}</td>
                      <td class="p-3">{{ row.nombre_completo }}</td>
                      <td class="p-3">{{ row.grupo ?? "—" }}</td>
                      <td class="p-3 font-semibold">
                        {{ cadetRowStatus(row) }}
                      </td>
                      <td class="p-3">
                        {{ cadetRowNotes(row) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            @if (cadetPreflightMatches() && cadetAccountsReady() && !cadetIncorporationResult()) {
              <div class="rounded-lg border p-4">
                <h4 class="font-semibold text-[#611232]">
                  Registro de cadetes
                </h4>

                <p class="mt-2 text-sm">
                  Esta operación requiere confirmación y
                  reautenticación. No se registrará parcialmente
                  el lote sin autorización.
                </p>

                <label
                  for="siga-cadet-reauth-password"
                  class="mt-3 block text-sm font-semibold"
                >
                  Contraseña del operador autorizado
                </label>

                <input
                  #sigaCadetPassword
                  id="siga-cadet-reauth-password"
                  type="password"
                  autocomplete="current-password"
                  [disabled]="!canConfirmCadetIncorporation() || cadetIncorporationLoading()"
                  (input)="cadetAuthorizationPasswordPresent.set(sigaCadetPassword.value.length > 0)"
                  class="mt-2 w-full max-w-md rounded-lg border p-3"
                />

                <button
                  data-testid="siga-cadet-incorporate-button"
                  type="button"
                  (click)="confirmCadetIncorporation(sigaCadetPassword.value); sigaCadetPassword.value = ''; cadetAuthorizationPasswordPresent.set(false)"
                  [disabled]="!canConfirmCadetIncorporation() || !cadetAccountsReady() || !cadetAuthorizationPasswordPresent() || cadetIncorporationLoading()"
                  class="mt-3 rounded-lg bg-[#611232] px-5 py-3 font-semibold text-white disabled:opacity-40"
                >
                  {{ cadetIncorporationLoading()
                    ? "Registrando..."
                    : "Registrar cadetes autorizados" }}
                </button>
              </div>
            }

            @if (cadetIncorporationResult(); as result) {
              <div role="status" class="rounded-lg border p-4 text-sm">
                <h4 class="font-semibold text-[#611232]">
                  Registro confirmado por SIGA
                </h4>
                <p>
                  Filas procesadas: {{ result.filas_procesadas }}
                </p>
                <p>
                  Personas creadas: {{ result.personas_creadas }}
                </p>
                <p>
                  Personas reutilizadas: {{ result.personas_reutilizadas }}
                </p>
                <p>
                  Usuarios creados: {{ result.usuarios_creados }}
                </p>
              </div>
            }

            <p class="text-xs text-gray-600">
              Validar el archivo no modifica la base institucional.
              Apto para registro no significa registrado.
            </p>
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

  // SIGA_CADETES_REAUTH_UI_V1
  readonly cadetAuthorizationPasswordPresent = signal(false);
  readonly cadetIncorporationLoading = signal(false);
  readonly cadetIncorporationError = signal<string | null>(null);
  readonly cadetIncorporationResult =
    signal<SigaCadetIncorporationResult | null>(null);


  readonly cadetOrganizeLoading = signal(false);
  readonly cadetOrganizePasswordPresent = signal(false);
  readonly cadetOrganizeError = signal<string | null>(null);
  readonly cadetExistingLookupLoading = signal(false);
  readonly cadetExistingLookupError = signal<string | null>(null);

  readonly cadetOrganizationResult = signal<
    (SigaOrganizacionExcel & { file: File }) | null
  >(null);

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

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
    this.cadetAuthorizationPasswordPresent.set(false);
    this.cadetOrganizePasswordPresent.set(false);
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
        if (this.cadetRosterFile() !== file) {
          this.cadetRosterLoading.set(false);
          return;
        }

        this.cadetRosterPreview.set(response.data);
        this.cadetRosterLoading.set(false);
        void this.tryReuseExistingCadetAcademy(file, response.data);
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
  private async findAcademicCatalogRows(
    endpoint: string,
    matches: (row: AcademicRow) => boolean,
    requiredCount: number
  ): Promise<AcademicRow[]> {
    const found: AcademicRow[] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const response = await firstValueFrom(
        this.http.get<AcademicResponse>(
          `${endpoint}?per_page=50&page=${page}`
        )
      );

      if (
        !response ||
        !Array.isArray(response.data) ||
        !response.meta ||
        !Number.isInteger(response.meta.last_page) ||
        response.meta.last_page < 1 ||
        response.meta.current_page !== page
      ) {
        throw new Error("Respuesta inconsistente del catalogo academico.");
      }

      lastPage = response.meta.last_page;

      for (const row of response.data) {
        if (matches(row)) {
          found.push(row);
        }
      }

      if (found.length >= requiredCount) {
        return found;
      }

      page++;
    } while (page <= lastPage);

    return found;
  }

  private async tryReuseExistingCadetAcademy(
    file: File,
    preview: CadetExcelPreview
  ): Promise<void> {
    const academy = (
      preview as CadetExcelPreview & { academia?: SigaAcademiaExcel }
    ).academia;

    if (
      !academy ||
      academy.lista_para_registro !== true ||
      academy.anio_generacion === null ||
      academy.errores.length !== 0 ||
      preview.summary.con_errores !== 0 ||
      preview.summary.nombres_pendientes_revision !== 0 ||
      academy.grupos_iniciales.length === 0
    ) {
      return;
    }

    this.cadetExistingLookupLoading.set(true);
    this.cadetExistingLookupError.set(null);

    const current = () =>
      this.cadetRosterFile() === file &&
      this.cadetRosterPreview() === preview;

    try {
      const programs = await this.findAcademicCatalogRows(
        "/api/academico/programas",
        row =>
          String(row["codigo"] ?? "") === academy.codigo_programa &&
          String(row["nombre"] ?? "") === academy.nombre_programa,
        1
      );

      if (!current() || programs.length !== 1) {
        return;
      }

      const programId = String(programs[0]["id_programa"] ?? "");

      if (!programId) {
        throw new Error("Programa institucional sin identificador.");
      }

      const cohorts = await this.findAcademicCatalogRows(
        "/api/academico/cohortes",
        row =>
          String(row["id_programa"] ?? "") === programId &&
          String(row["tipo"] ?? "") === academy.tipo_cohorte &&
          Number(row["numero"]) === academy.numero_generacion &&
          Number(row["anio"]) === academy.anio_generacion,
        1
      );

      if (!current() || cohorts.length !== 1) {
        return;
      }

      const cohortId = String(cohorts[0]["id_cohorte"] ?? "");

      if (!cohortId) {
        throw new Error("Cohorte institucional sin identificador.");
      }

      const expectedCodes = new Set(
        academy.grupos_iniciales.map(group => group.codigo)
      );

      const existingGroups = await this.findAcademicCatalogRows(
        "/api/academico/grupos",
        row =>
          String(row["id_cohorte"] ?? "") === cohortId &&
          expectedCodes.has(String(row["codigo"] ?? "")),
        expectedCodes.size
      );

      if (!current()) {
        return;
      }

      const foundCodes = new Set(
        existingGroups.map(row => String(row["codigo"] ?? ""))
      );

      if (
        existingGroups.length !== expectedCodes.size ||
        foundCodes.size !== expectedCodes.size ||
        existingGroups.some(
          row =>
            row["especializacion"] !== null ||
            !String(row["id_grupo"] ?? "")
        )
      ) {
        this.cadetExistingLookupError.set(
          "La organizacion existente requiere revisar sus grupos."
        );
        return;
      }

      this.cadetOrganizationResult.set({
        id_programa: programId,
        codigo_programa: academy.codigo_programa,
        id_cohorte: cohortId,
        numero_generacion: academy.numero_generacion,
        anio_generacion: academy.anio_generacion,
        cadetes_validados: preview.summary.total,
        grupos: existingGroups.map(row => ({
          codigo: String(row["codigo"]),
          id_grupo: String(row["id_grupo"]),
          especializacion: null,
        })),
        file,
      });

      // SIGA_C1_IMPORTACION_UNIFICADA_V1
      // Conciliacion automatica, sin escrituras.
      this.previsualizarCadetes();
    } catch (error) {
      if (current()) {
        this.cadetExistingLookupError.set(
          "No se pudo consultar la organizacion existente. " +
          "Revisa la sesion, los permisos y la conexion con Laravel."
        );
      }
    } finally {
      if (current()) {
        this.cadetExistingLookupLoading.set(false);
      }
    }
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

  organizeCadetAcademy(password: string): void {
    const file = this.cadetRosterFile();
    const academy = this.cadetAcademyInfo();

    if (
      !file ||
      !academy ||
      !this.canOrganizeCadetAcademy() ||
      this.cadetOrganizeLoading() ||
      password.length === 0
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
    form.append("declaracion_origen", "DATOS_INSTITUCIONALES_REALES");

    this.cadetPreflight.set(null);
    this.cadetIncorporationResult.set(null);
    this.cadetIncorporationError.set(null);
    this.cadetOrganizeLoading.set(true);
    this.cadetOrganizeError.set(null);
    this.cadetOrganizationResult.set(null);

    this.auth.reauthenticate(password).pipe(
      switchMap(() => this.http.post<{ data: SigaOrganizacionExcel }>(
        "/api/academico/importaciones/organizar",
        form
      ))
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

  cadetRowStatus(row: CadetExcelRow): string {
    const final = this.cadetIncorporationResult();
    const academy = this.cadetOrganizationResult();
    const preview = this.cadetRosterPreview();

    if (
      final &&
      academy &&
      preview &&
      final.id_cohorte === academy.id_cohorte &&
      final.filas_procesadas === preview.summary.total
    ) {
      return "REGISTRADO";
    }

    if (
      row.errores.length > 0 ||
      row.requiere_revision_nombre
    ) {
      return "NO APTO";
    }

    if (!this.cadetPreflightMatches()) {
      return "EN REVISION";
    }

    const detail = this.cadetPreflight()?.filas.find(
      item => item.fila_excel === row.fila_excel
    );

    if (!detail) {
      return "EN REVISION";
    }

    return detail.cuenta_pendiente_correo
      ? "NO APTO"
      : "APTO PRELIMINAR";
  }

  cadetRowNotes(row: CadetExcelRow): string {
    const notes = [
      ...row.errores,
      ...row.advertencias
    ];

    if (row.requiere_revision_nombre) {
      notes.push("Nombre pendiente de revision");
    }

    if (this.cadetPreflightMatches()) {
      const detail = this.cadetPreflight()?.filas.find(
        item => item.fila_excel === row.fila_excel
      );

      if (detail?.cuenta_pendiente_correo) {
        notes.push(
          "Falta correo institucional para crear Usuario"
        );
      }
    }

    return notes.length > 0
      ? notes.join("; ")
      : "Sin incidencias";
  }

  cadetReadyRows(): number {
    if (!this.cadetPreflightMatches()) {
      return 0;
    }

    const rows = this.cadetRosterPreview()?.filas ?? [];
    const details = this.cadetPreflight()?.filas ?? [];

    const byRow = new Map(
      details.map(item => [item.fila_excel, item])
    );

    return rows.filter(row =>
      row.errores.length === 0 &&
      !row.requiere_revision_nombre &&
      byRow.get(row.fila_excel)?.cuenta_pendiente_correo === false
    ).length;
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
          result.filas.every(item =>
            Number.isInteger(item.fila_excel) &&
            typeof item.cuenta_pendiente_correo === "boolean" &&
            typeof item.usuario_nuevo_previsto === "boolean"
          ) &&
          Number.isInteger(result.usuarios_nuevos_previstos) &&
          result.usuarios_nuevos_previstos >= 0 &&
          Number.isInteger(result.filas_sin_correo_para_cuenta) &&
          result.filas_sin_correo_para_cuenta >= 0 &&
          result.filas.filter(item =>
            item.cuenta_pendiente_correo
          ).length === result.filas_sin_correo_para_cuenta &&
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

  // SIGA_C1_CADETES_ACCESO_FRONTEND_V1
  // El Backend es la autoridad final; este control previene
  // confirmar lotes con cuentas incompletas desde Angular.
  cadetAccountsReady(): boolean {
    const check = this.cadetPreflight();

    return (
      this.cadetPreflightMatches() &&
      check !== null &&
      Number.isInteger(check.filas_sin_correo_para_cuenta) &&
      check.filas_sin_correo_para_cuenta === 0
    );
  }

  confirmCadetIncorporation(password: string): void {
    if (!this.canConfirmCadetIncorporation() || !this.cadetAccountsReady() || password.length === 0) {
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
      `Creara o reutilizara Usuarios y asignara PERFIL_CADETE. Las cuentas nuevas quedaran PENDIENTE, sin roles ni acceso habilitado.\n\n` +
      `¿Confirmas que son cadetes reales y autorizas el registro en SIGA?`;

    if (!window.confirm(message)) {
      return;
    }

    const form = new FormData();

    form.append("archivo", file, file.name);
    form.append("id_cohorte", organization.id_cohorte);
    form.append("modo", "CONFIRMAR");
    form.append("confirmacion", "INCORPORAR_CADETES_REALES");
    form.append("declaracion_origen", "DATOS_INSTITUCIONALES_REALES");

    this.cadetIncorporationLoading.set(true);
    this.cadetIncorporationError.set(null);
    this.cadetIncorporationResult.set(null);

    this.auth.reauthenticate(password).pipe(
      switchMap(() => this.http.post<{ data: SigaCadetIncorporationResult }>(
        "/api/academico/importaciones/incorporar",
        form
      ))
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
              : status === 423
                ? "Es necesaria una reautenticacion institucional reciente."
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