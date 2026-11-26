import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { AuthService } from "../../../auth/auth.service";

interface ReadinessSubject {
  id_materia_horario: string;
  codigo: string | null;
  nombre: string;
  horas_semanales: string | number;
  actividad_registrada: boolean;
  asignaciones_grupo: number;
  asignaciones_autorizadas_grupo: number;
  estado: string;
  observaciones: string[];
}

interface ReadinessData {
  id_horario: string;
  version: number;
  estado_horario: string;
  resumen: {
    materias: number;
    cadetes_grupo: number;
    formadores_registrados: number;
    materias_pendientes: number;
  };
  materias: ReadinessSubject[];
  persistido: boolean;
  habilitacion_automatica: boolean;
}

interface AssignmentOptions {
  id_grupo: string;
  actividades: Array<{
    id_actividad: string;
    codigo: string;
    nombre: string;
    tipo: string;
  }>;
  formadores: Array<{
    id_formador: string;
    nombre: string;
  }>;
  formadores_total: number;
}
@Component({
  selector: "app-academic-teacher-evaluation-readiness-page",
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header class="space-y-3">
        <h1 class="text-2xl font-bold text-[#611232]">
          Preparación de Evaluación Docente
        </h1>

        <p class="text-sm text-gray-700">
          Verifica las materias del horario, los cadetes incorporados,
          los formadores y las asignaciones antes de habilitar evaluaciones.
        </p>

        <div class="flex flex-wrap gap-4 text-sm">
          <a routerLink="/academico/organizacion/horarios"
             class="font-semibold text-[#611232] underline">
            Horarios Académicos
          </a>

          <a routerLink="/academico/formadores"
             class="font-semibold text-[#611232] underline">
            Personal formador
          </a>
        </div>
      </header>

      <section
        class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <label for="id-horario-evaluacion" class="block text-sm font-semibold">
          Identificador del horario guardado
        </label>

        <input
          id="id-horario-evaluacion"
          data-testid="evaluacion-id-horario"
          type="text"
          [value]="idHorario()"
          (input)="updateId($event)"
          placeholder="UUID del horario académico"
          class="block w-full rounded-xl border border-gray-300 p-3 text-sm"
        />

        <button
          type="button"
          data-testid="evaluacion-consultar-preparacion"
          [disabled]="loading()"
          (click)="consultar()"
          class="rounded-xl bg-[#611232] px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {{ loading() ? "Consultando..." : "Consultar preparación" }}
        </button>

        @if (error()) {
          <p role="alert" class="rounded-lg border border-red-300 p-3 text-sm text-red-800">
            {{ error() }}
          </p>
        }
      </section>

      @if (result(); as data) {
        <section class="space-y-5" data-testid="evaluacion-preparacion-resultado">
          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <p class="text-sm text-gray-600">
              Horario versión {{ data.version }} |
              Estado: <strong>{{ data.estado_horario }}</strong>
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl border border-gray-200 bg-white p-5">
              <p class="text-sm text-gray-600">Materias</p>
              <p class="mt-2 text-3xl font-bold">{{ data.resumen.materias }}</p>
            </div>

            <div class="rounded-2xl border border-gray-200 bg-white p-5">
              <p class="text-sm text-gray-600">Cadetes del grupo</p>
              <p class="mt-2 text-3xl font-bold">
                {{ data.resumen.cadetes_grupo }}
              </p>
            </div>

            <div class="rounded-2xl border border-gray-200 bg-white p-5">
              <p class="text-sm text-gray-600">Formadores registrados</p>
              <p class="mt-2 text-3xl font-bold">
                {{ data.resumen.formadores_registrados }}
              </p>
            </div>

            <div class="rounded-2xl border border-gray-200 bg-white p-5">
              <p class="text-sm text-gray-600">Materias pendientes</p>
              <p class="mt-2 text-3xl font-bold">
                {{ data.resumen.materias_pendientes }}
              </p>
            </div>
          </div>

          <section class="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 class="mb-4 text-lg font-bold text-[#611232]">
              Requisitos por materia
            </h2>

            <!-- SIGA_R05_I03_A03 -->
            <div class="mb-5 space-y-3 rounded-xl border border-gray-200 p-4">
              <p class="text-sm text-gray-700">
                El registro administrativo requiere reautenticación reciente.
                No autoriza ni abre evaluaciones para cadetes.
              </p>

              <div class="flex flex-wrap items-center gap-3">
                <label for="evaluacion-reauth" class="text-sm font-semibold">
                  Contraseña institucional
                </label>

                <input
                  id="evaluacion-reauth"
                  #reauthPassword
                  type="password"
                  autocomplete="current-password"
                  class="min-w-48 flex-1 rounded-lg border border-gray-300 p-2 text-sm"
                />

                <button
                  type="button"
                  [disabled]="reauthLoading()"
                  (click)="reauthenticate(reauthPassword)"
                  class="rounded-lg border border-[#611232] px-4 py-2 text-sm font-semibold text-[#611232] disabled:opacity-50"
                >
                  {{ reauthLoading() ? "Verificando..." : "Reautenticar" }}
                </button>
              </div>

              @if (reauthMessage()) {
                <p role="status" class="text-sm text-gray-700">
                  {{ reauthMessage() }}
                </p>
              }

              @if (registrationError()) {
                <p role="alert" class="text-sm text-red-800">
                  {{ registrationError() }}
                </p>
              }

              @if (registrationMessage()) {
                <p role="status" class="text-sm text-green-800">
                  {{ registrationMessage() }}
                </p>
              }
            </div>

            <div class="overflow-x-auto">
              <table class="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead class="border-b border-gray-300 bg-gray-50">
                  <tr>
                    <th class="p-3">Materia</th>
                    <th class="p-3">Clave</th>
                    <th class="p-3">Asignaciones</th>
                    <th class="p-3">Estado</th>
                    <th class="p-3">Requisitos pendientes</th>
                    <th class="p-3">Registro administrativo</th>
                  </tr>
                </thead>

                <tbody>
                  @for (subject of data.materias; track subject.id_materia_horario) {
                    <tr class="border-b border-gray-200">
                      <td class="p-3 font-medium">{{ subject.nombre }}</td>
                      <td class="p-3">{{ subject.codigo || "Sin clave" }}</td>
                      <td class="p-3">{{ subject.asignaciones_grupo }}</td>
                      <td class="p-3">{{ subject.estado }}</td>
                      <td class="p-3">
                        @for (issue of subject.observaciones; track issue) {
                          <p class="mb-1">{{ issueLabel(issue) }}</p>
                        }
                      </td>
                      <td class="p-3">
                        @if (subject.actividad_registrada) {
                          <span class="text-sm font-semibold text-green-800">
                            Actividad registrada
                          </span>
                        } @else {
                          <div class="flex flex-col gap-2">
                            <select
                              #tipoActividad
                              aria-label="Tipo de actividad evaluable"
                              class="rounded-lg border border-gray-300 p-2 text-sm"
                            >
                              <option value="MATERIA">Materia</option>
                              <option value="PRACTICA">Práctica</option>
                            </select>

                            <button
                              type="button"
                              [disabled]="
                                savingSubject() !== null ||
                                loading() ||
                                !validCode(subject.codigo) ||
                                subject.observaciones.includes('HORARIO_NO_VIGENTE')
                              "
                              (click)="registrarActividad(
                                subject.id_materia_horario,
                                tipoActividad.value
                              )"
                              class="rounded-lg bg-[#611232] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {{
                                savingSubject() === subject.id_materia_horario
                                  ? "Registrando..."
                                  : "Registrar actividad"
                              }}
                            </button>
                          </div>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <!-- SIGA_R05_I03_A04 -->
          <section class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
            <h2 class="text-lg font-bold text-[#611232]">
              Asignación de actividad a formador y grupo
            </h2>

            <p class="text-sm text-gray-700">
              El grupo se obtiene del horario consultado.
              Las asignaciones nuevas se registran como PROGRAMADAS.
              Se requiere reautenticación institucional reciente.
            </p>

            @if (optionsLoading()) {
              <p role="status" class="text-sm">
                Consultando actividades y formadores...
              </p>
            }

            @if (optionsError()) {
              <p role="alert" class="text-sm text-red-800">
                {{ optionsError() }}
              </p>
            }

            @if (assignmentError()) {
              <p role="alert" class="text-sm text-red-800">
                {{ assignmentError() }}
              </p>
            }

            @if (assignmentMessage()) {
              <p role="status" class="text-sm text-green-800">
                {{ assignmentMessage() }}
              </p>
            }

            @if (assignmentOptions(); as options) {
              <p class="text-sm text-gray-700">
                Actividades disponibles:
                <strong>{{ options.actividades.length }}</strong>.
                Formadores activos:
                <strong>{{ options.formadores_total }}</strong>.
              </p>

              @if (options.formadores_total > options.formadores.length) {
                <p role="status" class="text-sm text-amber-800">
                  La selección muestra únicamente los primeros 200 formadores.
                </p>
              }

              @if (
                options.actividades.length === 0 ||
                options.formadores.length === 0
              ) {
                <p class="rounded-lg border border-amber-200 p-3 text-sm">
                  Se requiere una actividad registrada y un formador activo
                  para crear una asignación.
                </p>
              } @else {
                <div class="grid gap-4 md:grid-cols-2">
                  <label class="space-y-1 text-sm">
                    <span class="block font-semibold">Actividad</span>
                    <select
                      #activitySelect
                      class="w-full rounded-lg border border-gray-300 p-2"
                    >
                      @for (item of options.actividades; track item.id_actividad) {
                        <option [value]="item.id_actividad">
                          {{ item.codigo }} — {{ item.nombre }}
                        </option>
                      }
                    </select>
                  </label>

                  <label class="space-y-1 text-sm">
                    <span class="block font-semibold">Formador</span>
                    <select
                      #trainerSelect
                      class="w-full rounded-lg border border-gray-300 p-2"
                    >
                      @for (item of options.formadores; track item.id_formador) {
                        <option [value]="item.id_formador">
                          {{ item.nombre }}
                        </option>
                      }
                    </select>
                  </label>

                  <label class="space-y-1 text-sm">
                    <span class="block font-semibold">Función</span>
                    <select
                      #roleSelect
                      class="w-full rounded-lg border border-gray-300 p-2"
                    >
                      <option value="DOCENTE">Docente</option>
                      <option value="INSTRUCTOR">Instructor</option>
                      <option value="AMBAS">Ambas</option>
                    </select>
                  </label>

                  <div class="hidden md:block"></div>

                  <label class="space-y-1 text-sm">
                    <span class="block font-semibold">Inicio de actividad</span>
                    <input
                      #startInput
                      type="datetime-local"
                      class="w-full rounded-lg border border-gray-300 p-2"
                    />
                  </label>

                  <label class="space-y-1 text-sm">
                    <span class="block font-semibold">Fin de actividad</span>
                    <input
                      #endInput
                      type="datetime-local"
                      class="w-full rounded-lg border border-gray-300 p-2"
                    />
                  </label>

                  <label class="space-y-1 text-sm">
                    <span class="block font-semibold">Apertura de evaluación</span>
                    <input
                      #openInput
                      type="datetime-local"
                      class="w-full rounded-lg border border-gray-300 p-2"
                    />
                  </label>

                  <label class="space-y-1 text-sm">
                    <span class="block font-semibold">Cierre de evaluación</span>
                    <input
                      #closeInput
                      type="datetime-local"
                      class="w-full rounded-lg border border-gray-300 p-2"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  [disabled]="assignmentSaving()"
                  (click)="registrarAsignacion(
                    activitySelect.value,
                    trainerSelect.value,
                    roleSelect.value,
                    startInput.value,
                    endInput.value,
                    openInput.value,
                    closeInput.value
                  )"
                  class="rounded-lg bg-[#611232] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {{
                    assignmentSaving()
                      ? "Registrando..."
                      : "Registrar asignación PROGRAMADA"
                  }}
                </button>
              }
            }
          </section>

          <p class="text-sm text-gray-700">
            Las asignaciones programadas no autorizan la evaluación
            ni habilitan el cuestionario para los cadetes.
          </p>
        </section>
      }
    </main>
  `,
})
export class AcademicTeacherEvaluationReadinessPageComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly idHorario = signal(
    this.route.snapshot.queryParamMap.get("id_horario") ?? "",
  );
  readonly loading = signal(false);
  readonly error = signal("");
  readonly result = signal<ReadinessData | null>(null);
  readonly reauthLoading = signal(false);
  readonly reauthMessage = signal("");
  readonly savingSubject = signal<string | null>(null);
  readonly registrationError = signal("");
  readonly registrationMessage = signal("");
  readonly assignmentOptions = signal<AssignmentOptions | null>(null);
  readonly optionsLoading = signal(false);
  readonly optionsError = signal("");
  readonly assignmentSaving = signal(false);
  readonly assignmentError = signal("");
  readonly assignmentMessage = signal("");

  constructor() {
    if (this.idHorario().trim()) {
      this.consultar();
    }
  }

  updateId(event: Event): void {
    this.idHorario.set((event.target as HTMLInputElement).value);
    this.result.set(null);
    this.error.set("");
  }

  consultar(): void {
    const id = this.idHorario().trim();

    if (
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)
    ) {
      this.error.set("Introduce un identificador de horario válido.");
      this.result.set(null);
      return;
    }

    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set("");
    this.result.set(null);
    this.assignmentOptions.set(null);
    this.optionsError.set("");

    this.http
      .get<{ data: ReadinessData }>(
        "/api/academico/evaluacion-docente/preparacion",
        { params: { id_horario: id } },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.result.set(response.data);
          this.loading.set(false);
          this.loadAssignmentOptions(id);
        },
        error: (response: HttpErrorResponse) => {
          const message = response.error?.message;

          this.error.set(
            typeof message === "string"
              ? message
              : "No fue posible consultar la preparación del horario.",
          );

          this.loading.set(false);
        },
      });
  }

  private loadAssignmentOptions(idHorario: string): void {
    this.optionsLoading.set(true);
    this.optionsError.set("");

    this.http.get<{ data: AssignmentOptions }>(
      "/api/academico/evaluacion-docente/asignaciones/opciones",
      { params: { id_horario: idHorario } },
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (this.idHorario().trim() === idHorario) {
            this.assignmentOptions.set(response.data);
            this.optionsLoading.set(false);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (this.idHorario().trim() === idHorario) {
            this.optionsLoading.set(false);
            this.optionsError.set(
              error.status === 403
                ? "No cuenta con permisos para consultar las opciones."
                : "No fue posible consultar actividades y formadores.",
            );
          }
        },
      });
  }

  private toApiTimestamp(value: string): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) {
      return null;
    }

    return date.toISOString().slice(0, 19) + "+00:00";
  }

  registrarAsignacion(
    activityId: string,
    trainerId: string,
    functionRole: string,
    startValue: string,
    endValue: string,
    openValue: string,
    closeValue: string,
  ): void {
    if (this.assignmentSaving()) {
      return;
    }

    this.assignmentError.set("");
    this.assignmentMessage.set("");

    const options = this.assignmentOptions();

    if (
      !options ||
      !options.actividades.some(
        (item) => item.id_actividad === activityId,
      ) ||
      !options.formadores.some(
        (item) => item.id_formador === trainerId,
      ) ||
      !["DOCENTE", "INSTRUCTOR", "AMBAS"].includes(functionRole)
    ) {
      this.assignmentError.set(
        "Selecciona una actividad, un formador y una función válidos.",
      );
      return;
    }

    const start = this.toApiTimestamp(startValue);
    const end = this.toApiTimestamp(endValue);
    const open = this.toApiTimestamp(openValue);
    const close = this.toApiTimestamp(closeValue);

    if (
      start === null ||
      end === null ||
      open === null ||
      close === null ||
      end < start ||
      open < end ||
      close <= open
    ) {
      this.assignmentError.set(
        "Las fechas deben seguir el orden: inicio, fin, " +
        "apertura y cierre. El cierre debe ser posterior a la apertura.",
      );
      return;
    }

    this.assignmentSaving.set(true);

    this.http.post(
      "/api/academico/evaluacion-docente/asignaciones",
      {
        id_actividad: activityId,
        id_grupo: options.id_grupo,
        id_formador: trainerId,
        funciones: functionRole,
        inicio_actividad: start,
        fin_actividad: end,
        apertura_evaluacion: open,
        cierre_evaluacion: close,
      },
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.assignmentSaving.set(false);
          this.assignmentMessage.set(
            "Asignación PROGRAMADA registrada. " +
            "Las evaluaciones siguen deshabilitadas.",
          );
          this.consultar();
        },
        error: (error: HttpErrorResponse) => {
          this.assignmentSaving.set(false);

          if (error.status === 403) {
            this.assignmentError.set(
              "Operación denegada. Verifica permisos y reautenticación.",
            );
          } else if (error.status === 422) {
            this.assignmentError.set(
              "La asignación no cumple las condiciones institucionales.",
            );
          } else {
            this.assignmentError.set(
              "No se pudo confirmar el registro de la asignación.",
            );
          }
        },
      });
  }
  validCode(code: string | null): boolean {
    return typeof code === "string" &&
      /^[A-Z0-9._-]{1,40}$/.test(code);
  }

  reauthenticate(input: HTMLInputElement): void {
    if (this.reauthLoading()) {
      return;
    }

    const password = input.value;
    input.value = "";

    if (!password) {
      this.reauthMessage.set("Introduce tu contraseña institucional.");
      return;
    }

    this.reauthLoading.set(true);
    this.reauthMessage.set("");

    this.auth.reauthenticate(password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reauthLoading.set(false);
          this.reauthMessage.set(
            "Reautenticación confirmada por el servidor.",
          );
        },
        error: () => {
          this.reauthLoading.set(false);
          this.reauthMessage.set(
            "No se pudo completar la reautenticación.",
          );
        },
      });
  }

  registrarActividad(subjectId: string, type: string): void {
    if (
      this.loading() ||
      this.savingSubject() !== null ||
      !["MATERIA", "PRACTICA"].includes(type)
    ) {
      return;
    }

    const current = this.result();
    const subject = current?.materias.find(
      (item) => item.id_materia_horario === subjectId,
    );

    if (
      !subject ||
      subject.actividad_registrada ||
      !this.validCode(subject.codigo) ||
      subject.observaciones.includes("HORARIO_NO_VIGENTE")
    ) {
      this.registrationError.set(
        "La materia todavía no cumple los requisitos de registro.",
      );
      return;
    }

    this.savingSubject.set(subjectId);
    this.registrationError.set("");
    this.registrationMessage.set("");

    this.http.post(
      "/api/academico/evaluacion-docente/actividades",
      {
        id_materia_horario: subjectId,
        tipo: type,
      },
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingSubject.set(null);
          this.registrationMessage.set(
            "Registro administrativo aceptado. Se actualizó la preparación.",
          );
          this.consultar();
        },
        error: (error: HttpErrorResponse) => {
          this.savingSubject.set(null);

          if (error.status === 403) {
            this.registrationError.set(
              "Operación denegada. Verifica tus permisos y la reautenticación reciente.",
            );
          } else if (error.status === 422) {
            this.registrationError.set(
              "La materia no cumple las condiciones institucionales de registro.",
            );
          } else {
            this.registrationError.set(
              "No se pudo registrar la actividad. No se ha confirmado ninguna escritura.",
            );
          }
        },
      });
  }
  issueLabel(code: string): string {
    const labels: Record<string, string> = {
      HORARIO_NO_VIGENTE: "El horario no está vigente",
      MATERIA_SIN_CLAVE: "Falta la clave institucional",
      CLAVE_DUPLICADA_EN_HORARIO: "Clave repetida en el horario",
      GRUPO_SIN_CADETES: "No hay cadetes incorporados",
      FORMADORES_NO_REGISTRADOS: "No hay formadores registrados",
      ACTIVIDAD_EVALUABLE_NO_REGISTRADA: "Falta registrar la actividad evaluable",
      SIN_ASIGNACION_DOCENTE: "Falta asignación de formador",
      VINCULO_Y_CONCLUSION_REQUIEREN_VERIFICACION:
        "Debe verificarse el vínculo y la conclusión académica",
    };

    return labels[code] ?? code;
  }
}