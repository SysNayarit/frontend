import {
  inject as injectScheduleCode,
  signal as scheduleCodeSignal,
} from "@angular/core";
import {
  AuthService as ScheduleCodeAuthService,
} from "../../../auth/auth.service";

// SIGA_R05_I03_A10B
import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { AcademicOrganizationNavigationComponent } from "../components/academic-organization-navigation.component";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

// SIGA_HORARIOS_MULTIMATERIA_R03
// Prototipo local: no consulta ni modifica registros institucionales.

interface WorkingDay {
  id: number;
  name: string;
  enabled: boolean;
  start: string;
  end: string;
}

interface Subject {
  id: number;
  name: string;
  hours: string;
}

interface SuggestedBlock {
  subject: string;
  start: string;
  end: string;
  hours: number;
}

// SIGA_HORARIOS_CATALOGOS_I02_R02
interface SigaCatalogResponse<T> {
  data: T[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
  };
}

interface SigaProgram {
  id_programa: string;
  codigo: string;
  nombre: string;
}

interface SigaCohort {
  id_cohorte: string;
  id_programa: string;
  tipo: string;
  numero: number;
  anio: number;
}

interface SigaGroup {
  id_grupo: string;
  id_cohorte: string;
  codigo: string;
  especializacion: string | null;
}

// SIGA_HORARIOS_GUARDADO_A07
interface SavedSchedule {
  id_horario: string;
  id_grupo: string;
  vigente_desde: string;
  vigente_hasta: string;
  version: number;
  estado: string;
}

interface SavedScheduleDetail {
  horario: SavedSchedule & {
    jornadas: Array<{
      dia_semana: number;
      habilitado: boolean;
      hora_inicio: string;
      hora_fin: string;
    }>;
    codigo_grupo: string;
    nombre_programa: string;
  };
  materias: Array<{
    id_materia_horario: string;
    codigo_materia: string | null;
    nombre_materia: string;
    horas_semanales: number | string;
  }>;
  bloques: Array<{
    id_bloque: string;
    id_materia_horario: string;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
  }>;
}

@Component({
  selector: "app-academic-class-schedule-page",
  standalone: true,
  imports: [AcademicOrganizationNavigationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="space-y-6">
      <app-academic-organization-navigation />
      <header class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">


        <h1 class="mt-3 text-2xl font-bold text-[#611232]">
          Horarios de Clases
        </h1>

        <p class="mt-2 text-sm text-gray-600">
          Configura las jornadas, distribuye varias materias por semana
          y consulta una propuesta de horario sin registrar cambios.
        </p>
      </header>

      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 class="text-lg font-bold text-[#611232]">
          Contexto académico institucional
        </h2>

        <p class="mt-2 text-sm text-gray-600">
          Selecciona programa, generación, grupo y formador desde SIGA.
          Esta operación no guarda horarios institucionales.
        </p>

        @if (catalogLoading()) {
          <p role="status" class="mt-3 text-sm text-gray-600">
            Consultando catálogos académicos...
          </p>
        }

        @if (catalogError()) {
          <p role="alert" class="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            {{ catalogError() }}
          </p>
        }

        <div class="mt-5 grid gap-4 md:grid-cols-3">
          <label class="block text-sm font-semibold text-gray-700">
            Programa académico
            <select
              [value]="programId()"
              [disabled]="catalogLoading() || !!catalogError()"
              (change)="chooseProgram($any($event.target).value)"
              class="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 disabled:opacity-50"
            >
              <option value="">Seleccionar programa</option>
              @for (program of programs(); track program.id_programa) {
                <option [value]="program.id_programa">
                  {{ program.codigo }} — {{ program.nombre }}
                </option>
              }
            </select>
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            Generación
            <select
              [value]="cohortId()"
              [disabled]="!programId()"
              (change)="chooseCohort($any($event.target).value)"
              class="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 disabled:opacity-50"
            >
              <option value="">Seleccionar generación</option>
              @for (cohort of availableCohorts(); track cohort.id_cohorte) {
                <option [value]="cohort.id_cohorte">
                  {{ cohort.tipo }} {{ cohort.numero }} / {{ cohort.anio }}
                </option>
              }
            </select>
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            Grupo
            <select
              [value]="groupId()"
              [disabled]="!cohortId()"
              (change)="chooseGroup($any($event.target).value)"
              class="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 disabled:opacity-50"
            >
              <option value="">Seleccionar grupo</option>
              @for (group of availableGroups(); track group.id_grupo) {
                <option [value]="group.id_grupo">
                  {{ group.codigo }}
                  @if (group.especializacion) {
                    — {{ group.especializacion }}
                  }
                </option>
              }
            </select>
          </label>
        </div>

        <p class="mt-4 text-xs text-gray-600">
          La selección institucional y el simulador multimateria
          todavía no generan registros de asignaciones.
          Las materias de ejemplo no son altas institucionales.
        </p>
      </section>
      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 class="text-lg font-bold text-[#611232]">
          Jornada de clases por día
        </h2>

        <p class="mt-2 text-sm text-gray-600">
          La jornada predeterminada es de 07:00 a 17:00.
          Puedes modificarla de forma independiente en cada día.
        </p>

        <div class="mt-5 overflow-x-auto">
          <table class="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-[#611232]">
                <th class="p-3">Día</th>
                <th class="p-3">Activo</th>
                <th class="p-3">Entrada</th>
                <th class="p-3">Salida</th>
                <th class="p-3">Capacidad</th>
              </tr>
            </thead>
            <tbody>
              @for (day of days(); track day.id; let i = $index) {
                <tr class="border-b border-gray-100">
                  <th class="p-3">{{ day.name }}</th>
                  <td class="p-3">
                    <input
                      type="checkbox"
                      [checked]="day.enabled"
                      [attr.aria-label]="'Habilitar ' + day.name"
                      (change)="updateDay(i, 'enabled', $any($event.target).checked)"
                    />
                  </td>
                  <td class="p-3">
                    <input
                      type="time"
                      step="1800"
                      [disabled]="!day.enabled"
                      [value]="day.start"
                      [attr.aria-label]="'Entrada ' + day.name"
                      (input)="updateDay(i, 'start', $any($event.target).value)"
                      class="rounded-lg border border-gray-300 p-2"
                    />
                  </td>
                  <td class="p-3">
                    <input
                      type="time"
                      step="1800"
                      [disabled]="!day.enabled"
                      [value]="day.end"
                      [attr.aria-label]="'Salida ' + day.name"
                      (input)="updateDay(i, 'end', $any($event.target).value)"
                      class="rounded-lg border border-gray-300 p-2"
                    />
                  </td>
                  <td class="p-3 font-semibold">
                    {{ capacityByDay()[i] }} h
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="text-sm font-semibold text-gray-700">
            Inicio del período
            <input
              type="date"
              [value]="startDate()"
              (input)="startDate.set($any($event.target).value)"
              class="mt-2 w-full rounded-xl border border-gray-300 p-3"
            />
          </label>

          <label class="text-sm font-semibold text-gray-700">
            Término del período
            <input
              type="date"
              [value]="endDate()"
              (input)="endDate.set($any($event.target).value)"
              class="mt-2 w-full rounded-xl border border-gray-300 p-3"
            />
          </label>
        </div>
      </section>

      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-[#611232]">
              Materias de la semana
            </h2>
            <p class="mt-1 text-sm text-gray-600">
              Puedes programar de una a doce materias o agregar más.
            </p>
          </div>

          <button
            type="button"
            (click)="addSubject()"
            class="rounded-xl bg-[#611232] px-4 py-2 font-semibold text-white"
          >
            + Agregar materia
          </button>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            (click)="loadExample(5, 8)"
            class="rounded-lg border border-[#611232] px-3 py-2 text-sm font-semibold text-[#611232]"
          >
            5 materias de 8 h
          </button>
          <button
            type="button"
            (click)="loadExample(3, 20)"
            class="rounded-lg border border-[#611232] px-3 py-2 text-sm font-semibold text-[#611232]"
          >
            3 materias de 20 h
          </button>
        </div>

        <div class="mt-5 space-y-3">
          @for (subject of subjects(); track subject.id; let i = $index) {
            <div class="grid grid-cols-[minmax(0,1fr)_110px_auto] items-center gap-2">
              <input
                type="text"
                maxlength="200"
                [value]="subject.name"
                [attr.aria-label]="'Nombre de materia ' + (i + 1)"
                (input)="updateSubject(subject.id, 'name', $any($event.target).value)"
                class="min-w-0 rounded-xl border border-gray-300 p-3"
              />

              <label class="text-xs text-gray-600">
                Horas/sem.
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  [value]="subject.hours"
                  [attr.aria-label]="'Horas de ' + subject.name"
                  (input)="updateSubject(subject.id, 'hours', $any($event.target).value)"
                  class="mt-1 w-full rounded-xl border border-gray-300 p-2"
                />
              </label>

              <button
                type="button"
                [disabled]="subjects().length <= 1"
                (click)="removeSubject(subject.id)"
                class="rounded-lg border border-gray-300 p-2 text-sm text-[#611232] disabled:opacity-40"
                [attr.aria-label]="'Quitar ' + subject.name"
              >
                Quitar
              </button>
            </div>
          }
        </div>

        <p class="mt-3 text-sm text-gray-600">
          Materias configuradas: <strong>{{ subjects().length }}</strong>.
          Las materias son referencias locales; todavía no se seleccionan
          desde el catálogo institucional.
        </p>
      </section>

      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 class="text-lg font-bold text-[#611232]">
          Indicadores de carga semanal
        </h2>

        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl bg-gray-50 p-4">
            <p class="text-xs text-gray-600">Capacidad semanal</p>
            <p class="mt-1 text-2xl font-bold">{{ capacity() }} h</p>
          </div>
          <div class="rounded-xl bg-gray-50 p-4">
            <p class="text-xs text-gray-600">Carga solicitada</p>
            <p class="mt-1 text-2xl font-bold">{{ requested() }} h</p>
          </div>
          <div class="rounded-xl bg-gray-50 p-4">
            <p class="text-xs text-gray-600">Horas acomodadas</p>
            <p class="mt-1 text-2xl font-bold">{{ plan().total }} h</p>
          </div>
          <div class="rounded-xl bg-gray-50 p-4">
            <p class="text-xs text-gray-600">Horas pendientes</p>
            <p class="mt-1 text-2xl font-bold">
              {{ pending() }} h
            </p>
          </div>
        </div>

        <div class="mt-4 rounded-xl border border-gray-200 p-4 text-sm">
          <p>
            Materias de 8 horas que cabrían teóricamente:
            <strong>{{ maxSubjects(8) }}</strong>.
          </p>
          <p class="mt-1">
            Materias de 20 horas que cabrían teóricamente:
            <strong>{{ maxSubjects(20) }}</strong>.
          </p>
          <p class="mt-1">
            Ocupación de la jornada:
            <strong>{{ occupation() }} %</strong>.
          </p>
          @if (periodHours() !== null) {
            <p class="mt-1">
              Horas acomodadas durante el período:
              <strong>{{ periodHours() }} h</strong>.
            </p>
          }
        </div>

        @if (errors().length > 0) {
          <div role="alert" class="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p class="font-semibold text-amber-900">
              Revisa la configuración
            </p>
            <ul class="mt-2 list-disc pl-5 text-sm text-amber-900">
              @for (error of errors(); track error) {
                <li>{{ error }}</li>
              }
            </ul>
          </div>
        } @else if (pending() > 0) {
          <p role="alert" class="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            La capacidad semanal no alcanza. Faltan {{ pending() }} horas
            por acomodar. Amplía jornadas o ajusta la carga.
          </p>
        } @else {
          <p role="status" class="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-900">
            La carga solicitada cabe en las jornadas configuradas.
            La disponibilidad institucional sigue pendiente de verificar.
          </p>
        }
      </section>

      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 class="text-lg font-bold text-[#611232]">
          Horario semanal sugerido
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Reparto automático orientativo en bloques de media hora.
          Al modificar materias o jornadas, el horario se recalcula.
        </p>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          @for (day of days(); track day.id; let i = $index) {
            <div class="rounded-xl border border-gray-200 p-4">
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-bold text-[#611232]">{{ day.name }}</h3>
                <span class="text-sm text-gray-600">
                  {{ plan().loads[i] }} / {{ capacityByDay()[i] }} h
                </span>
              </div>

              @for (block of plan().blocks[i]; track $index) {
                <div class="mt-2 rounded-lg bg-[#e6d194]/20 p-3">
                  <p class="font-semibold text-[#611232]">
                    {{ block.subject }}
                  </p>
                  <p class="mt-1 text-sm text-gray-700">
                    {{ block.start }} – {{ block.end }}
                    · {{ block.hours }} h
                  </p>
                </div>
              } @empty {
                <p class="mt-3 text-sm text-gray-500">
                  Sin clases sugeridas.
                </p>
              }
            </div>
          }
        </div>

        <p class="mt-5 text-xs text-gray-600">
          Prototipo de distribución, no horario institucional aprobado.
          No descuenta recreos, alimentos, suspensiones ni días inhábiles.
          Tampoco comprueba la disponibilidad real de formadores,
          grupos, sedes o espacios. No guarda cambios en SIGA.
        </p>
      </section>
      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 class="text-lg font-bold text-[#611232]">
          Guardar y consultar horarios
        </h2>

        <p class="mt-2 text-sm text-gray-600">
          Guarda una propuesta como borrador institucional para el grupo
          y período seleccionados. Cada nuevo guardado del mismo período
          genera otra versión; no borra las anteriores.
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            [disabled]="saving() || !groupId()"
            (click)="saveDraft()"
            class="rounded-xl bg-[#611232] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {{ saving() ? 'Guardando...' : 'Guardar horario como borrador' }}
          </button>

          <button
            type="button"
            [disabled]="!groupId() || savedLoading()"
            (click)="refreshSaved()"
            class="rounded-xl border border-[#611232] px-4 py-3 text-sm font-semibold text-[#611232] disabled:opacity-50"
          >
            Consultar horarios guardados
          </button>
        </div>

        @if (saveMessage()) {
          <p role="status" class="mt-3 text-sm font-semibold text-green-800">
            {{ saveMessage() }}
          </p>
        }

        @if (saveError()) {
          <p role="alert" class="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            {{ saveError() }}
          </p>
        }

        @if (savedLoading()) {
          <p role="status" class="mt-3 text-sm text-gray-600">
            Consultando versiones del grupo seleccionado...
          </p>
        }

        @if (savedError()) {
          <p role="alert" class="mt-3 text-sm text-amber-900">
            {{ savedError() }}
          </p>
        }

        @if (groupId() && !savedLoading()) {
          <div class="mt-5 space-y-2">
            <h3 class="font-semibold text-[#611232]">
              Versiones guardadas del grupo
            </h3>

            @for (saved of savedSchedules(); track saved.id_horario) {
              <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-3">
                <div class="text-sm">
                  <p class="font-semibold">
                    {{ saved.vigente_desde }} a {{ saved.vigente_hasta }}
                  </p>
                  <p class="text-gray-600">
                    Versión {{ saved.version }} · {{ saved.estado }}
                  </p>
                </div>

                <button
                  type="button"
                  (click)="viewSaved(saved.id_horario)"
                  class="rounded-lg border border-[#611232] px-3 py-2 text-sm font-semibold text-[#611232]"
                >
                  Ver horario guardado
                </button>
              </div>
            } @empty {
              <p class="text-sm text-gray-500">
                No se muestran horarios guardados para este grupo.
              </p>
            }
          </div>
        }

        @if (detailLoading()) {
          <p role="status" class="mt-4 text-sm text-gray-600">
            Recuperando el horario seleccionado...
          </p>
        }

        @if (detailError()) {
          <p role="alert" class="mt-3 text-sm text-amber-900">
            {{ detailError() }}
          </p>
        }

        @if (savedDetail(); as detail) {
          <div class="mt-6 rounded-xl border border-gray-200 p-4">
            <h3 class="font-bold text-[#611232]">
              Horario recuperado · Versión {{ detail.horario.version }}
            </h3>

            <!-- SIGA_HORARIOS_REUTILIZAR_A10_I03 -->
            <div class="mt-3">
              <button
                type="button"
                (click)="loadSavedAsNewVersion(detail)"
                class="rounded-xl border border-[#611232] px-4 py-3 text-sm font-semibold text-[#611232]"
              >
                Utilizar como nueva versión
              </button>
              <p class="mt-2 text-xs text-gray-600">
                Carga jornadas, período y materias en el editor.
                La distribución de bloques se recalcula.
                La versión original permanece intacta.
              </p>
            </div>

            <!-- SIGA_HORARIOS_AUTORIZAR_A10_I10 -->
            @if (detail.horario.estado === 'BORRADOR') {
              <div class="mt-3">
                <button
                  type="button"
                  [disabled]="authorizationLoading()"
                  (click)="authorizeSavedVersion(detail.horario.id_horario, detail.horario.version)"
                  class="rounded-xl border border-[#611232] px-4 py-3 text-sm font-semibold text-[#611232] disabled:opacity-50"
                >
                  {{ authorizationLoading() ? 'Autorizando versión...' : 'Autorizar versión' }}
                </button>
                <p class="mt-2 text-xs text-gray-600">
                  Esta operación requiere el permiso institucional de autorización.
                  La versión vigente anterior del mismo grupo y período será sustituida.
                </p>
              </div>
            }

            @if (authorizationError()) {
              <p role="alert" class="mt-3 text-sm text-amber-900">
                {{ authorizationError() }}
              </p>
            }

            @if (authorizationMessage()) {
              <p role="status" class="mt-3 text-sm font-semibold text-green-800">
                {{ authorizationMessage() }}
              </p>
            }

            <!-- SIGA_HORARIOS_EXCEL_A09_I02 -->
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                [disabled]="excelLoading()"
                (click)="downloadSavedExcel(detail.horario.id_horario, detail.horario.version)"
                class="rounded-xl bg-[#611232] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {{ excelLoading() ? 'Preparando Excel...' : 'Descargar Excel (.xlsx)' }}
              </button>
            </div>

            @if (excelError()) {
              <p role="alert" class="mt-3 text-sm text-amber-900">
                {{ excelError() }}
              </p>
            }

            <p class="mt-2 text-sm text-gray-600">
              {{ detail.horario.nombre_programa }}
              · Grupo {{ detail.horario.codigo_grupo }}
              · {{ detail.horario.vigente_desde }}
              a {{ detail.horario.vigente_hasta }}
            </p>

            <p class="mt-1 text-xs text-gray-600">
              Esta vista muestra los bloques realmente recuperados
              de PostgreSQL. No sustituye el programador actual ni
              redistribuye automáticamente el horario guardado.
            </p>

            <div class="mt-4 overflow-x-auto">
              <table class="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr class="border-b border-gray-200 text-[#611232]">
                    <th class="p-2">Día</th>
                    <th class="p-2">Inicio</th>
                    <th class="p-2">Fin</th>
                    <th class="p-2">Materia</th>
                  </tr>
                </thead>
                <tbody>
                  @for (block of detail.bloques; track block.id_bloque) {
                    <tr class="border-b border-gray-100">
                      <td class="p-2">{{ dayLabel(block.dia_semana) }}</td>
                      <td class="p-2">{{ block.hora_inicio }}</td>
                      <td class="p-2">{{ block.hora_fin }}</td>
                      <td class="p-2">
                        {{ savedSubjectName(detail, block.id_materia_horario) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </section>
    </main>

    <!-- SIGA_R05_I03_A10B -->
    @if (savedDetail(); as detalleClaves) {
      @if (detalleClaves.horario.estado === 'BORRADOR') {
        <section class="mx-auto my-6 max-w-6xl space-y-4 rounded-xl border border-gray-200 bg-white p-5">
          <h2 class="text-lg font-bold text-[#611232]">
            Claves institucionales de materias
          </h2>

          <p class="text-sm text-gray-700">
            Corrige las claves del horario guardado.
            No se modifican nombres, horas, bloques ni versiones.
          </p>

          <p class="text-sm">
            Horario:
            <strong>{{ detalleClaves.horario.id_horario }}</strong>
          </p>

          <div class="flex flex-wrap items-end gap-3">
            <label class="flex-1 space-y-1 text-sm">
              <span class="block font-semibold">
                Contraseña institucional
              </span>
              <input
                #passwordClaves
                type="password"
                autocomplete="current-password"
                class="w-full rounded-lg border border-gray-300 p-2"
              />
            </label>

            <button
              type="button"
              [disabled]="a10ReauthBusy()"
              (click)="a10Reautenticar(passwordClaves)"
              class="rounded-lg border border-[#611232] px-4 py-2 text-sm font-semibold text-[#611232] disabled:opacity-50"
            >
              {{
                a10ReauthBusy()
                  ? "Verificando..."
                  : "Reautenticar"
              }}
            </button>
          </div>

          @if (a10Message()) {
            <p role="status" class="text-sm text-gray-700">
              {{ a10Message() }}
            </p>
          }

          @if (a10Error()) {
            <p role="alert" class="text-sm text-red-800">
              {{ a10Error() }}
            </p>
          }

          <div class="space-y-3">
            @for (
              materiaClave of detalleClaves.materias;
              track materiaClave.id_materia_horario
            ) {
              <div class="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-3">
                <div class="min-w-48 flex-1">
                  <p class="font-semibold">
                    {{ materiaClave.nombre_materia }}
                  </p>
                  <p class="text-xs text-gray-600">
                    Clave actual:
                    {{ materiaClave.codigo_materia || "Sin clave" }}
                  </p>
                </div>

                <label class="space-y-1 text-sm">
                  <span class="block font-semibold">
                    Clave oficial
                  </span>
                  <input
                    #claveOficial
                    type="text"
                    maxlength="40"
                    [value]="materiaClave.codigo_materia ?? ''"
                    autocomplete="off"
                    placeholder="Clave institucional"
                    class="rounded-lg border border-gray-300 p-2"
                  />
                </label>

                <button
                  type="button"
                  [disabled]="
                    a10Saving() !== null ||
                    !a10Reauthenticated()
                  "
                  (click)="a10GuardarClave(
                    detalleClaves.horario.id_horario,
                    materiaClave.id_materia_horario,
                    claveOficial.value
                  )"
                  class="rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {{
                    a10Saving() === materiaClave.id_materia_horario
                      ? "Guardando..."
                      : "Guardar clave"
                  }}
                </button>
              </div>
            }
          </div>

          <p class="text-xs text-gray-600">
            Solo claves oficiales: letras mayúsculas, números,
            punto, guion y guion bajo; máximo 40 caracteres.
          </p>
        </section>
      }
    }
`,
})
export class AcademicClassSchedulePageComponent {
  private readonly http = inject(HttpClient);

  readonly programs = signal<SigaProgram[]>([]);
  readonly cohorts = signal<SigaCohort[]>([]);
  readonly groups = signal<SigaGroup[]>([]);


  readonly programId = signal("");
  readonly cohortId = signal("");
  readonly groupId = signal("");


  readonly catalogLoading = signal(true);
  readonly catalogError = signal<string | null>(null);



  readonly availableCohorts = computed(() =>
    this.cohorts().filter(
      cohort => cohort.id_programa === this.programId(),
    ),
  );

  readonly availableGroups = computed(() =>
    this.groups().filter(
      group => group.id_cohorte === this.cohortId(),
    ),
  );

  constructor() {
    void this.loadAcademicCatalogs();

  }

  chooseProgram(id: string): void {
    this.programId.set(id);
    this.cohortId.set("");
    this.groupId.set("");
    this.clearSavedView();
  }

  chooseCohort(id: string): void {
    this.cohortId.set(id);
    this.groupId.set("");
    this.clearSavedView();
  }

  private async fetchAll<T>(endpoint: string): Promise<T[]> {
    const records: T[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      if (page > 200) {
        throw new Error("LIMITE_PAGINACION_SUPERADO");
      }

      const response = await firstValueFrom(
        this.http.get<SigaCatalogResponse<T>>(
          `${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${page}&per_page=50`,
        ),
      );

      if (
        !response ||
        !Array.isArray(response.data) ||
        !response.meta ||
        !Number.isInteger(response.meta.last_page) ||
        response.meta.last_page < 1 ||
        response.meta.current_page !== page ||
        (page > 1 && response.meta.last_page !== totalPages)
      ) {
        throw new Error("CONTRATO_CATALOGO_INVALIDO");
      }

      records.push(...response.data);
      totalPages = response.meta.last_page;
      page++;
    } while (page <= totalPages);

    return records;
  }

  private async loadAcademicCatalogs(): Promise<void> {
    this.catalogLoading.set(true);
    this.catalogError.set(null);

    try {
      const [programs, cohorts, groups] = await Promise.all([
        this.fetchAll<SigaProgram>("/api/academico/programas"),
        this.fetchAll<SigaCohort>("/api/academico/cohortes"),
        this.fetchAll<SigaGroup>("/api/academico/grupos"),
      ]);

      this.programs.set(programs);
      this.cohorts.set(cohorts);
      this.groups.set(groups);
    } catch {
      this.programs.set([]);
      this.cohorts.set([]);
      this.groups.set([]);

      this.catalogError.set(
        "No fue posible consultar los catálogos académicos. " +
        "Verifica la sesión, los permisos y Laravel.",
      );
    } finally {
      this.catalogLoading.set(false);
    }
  }

  readonly days = signal<WorkingDay[]>(this.defaultDays());
  readonly subjects = signal<Subject[]>(this.exampleSubjects(5, 8));
  readonly startDate = signal("");
  readonly endDate = signal("");
  private nextSubjectId = 6;

  readonly capacityByDay = computed(() =>
    this.days().map(day => {
      if (!day.enabled) return 0;

      const from = this.minutes(day.start);
      const to = this.minutes(day.end);

      if (
        !Number.isFinite(from) ||
        !Number.isFinite(to) ||
        to <= from ||
        from % 30 !== 0 ||
        to % 30 !== 0
      ) {
        return 0;
      }

      return (to - from) / 60;
    }),
  );

  readonly capacity = computed(() =>
    this.capacityByDay().reduce((sum, value) => sum + value, 0),
  );

  readonly requested = computed(() =>
    this.subjects().reduce((sum, subject) => {
      const hours = Number(subject.hours);
      return sum + (Number.isFinite(hours) && hours > 0 ? hours : 0);
    }, 0),
  );

  readonly plan = computed(() => {
    const days = this.days();
    const subjects = this.subjects();
    const caps = this.capacityByDay().map(hours => Math.round(hours * 2));

    const allocations = subjects.map(() => [0, 0, 0, 0, 0]);
    const loads = [0, 0, 0, 0, 0];

    for (let subjectIndex = 0; subjectIndex < subjects.length; subjectIndex++) {
      const hours = Number(subjects[subjectIndex].hours);

      if (
        !Number.isFinite(hours) ||
        hours <= 0 ||
        hours * 2 % 1 !== 0
      ) {
        continue;
      }

      let remaining = Math.round(hours * 2);

      while (remaining > 0) {
        let best = -1;

        for (let d = 0; d < days.length; d++) {
          if (loads[d] >= caps[d]) continue;

          if (
            best === -1 ||
            allocations[subjectIndex][d] < allocations[subjectIndex][best] ||
            (
              allocations[subjectIndex][d] === allocations[subjectIndex][best] &&
              loads[d] / caps[d] < loads[best] / caps[best]
            )
          ) {
            best = d;
          }
        }

        if (best === -1) break;

        allocations[subjectIndex][best]++;
        loads[best]++;
        remaining--;
      }
    }

    const blocks: SuggestedBlock[][] = days.map((day, dayIndex) => {
      let cursor = this.minutes(day.start);
      const result: SuggestedBlock[] = [];

      subjects.forEach((subject, subjectIndex) => {
        const units = allocations[subjectIndex][dayIndex];
        if (units <= 0 || !Number.isFinite(cursor)) return;

        const end = cursor + units * 30;

        result.push({
          subject: subject.name || `Materia ${subjectIndex + 1}`,
          start: this.clock(cursor),
          end: this.clock(end),
          hours: units / 2,
        });

        cursor = end;
      });

      return result;
    });

    return {
      blocks,
      loads: loads.map(value => value / 2),
      total: loads.reduce((sum, value) => sum + value, 0) / 2,
    };
  });

  readonly pending = computed(() =>
    Math.max(0, this.requested() - this.plan().total),
  );

  readonly occupation = computed(() =>
    this.capacity() > 0
      ? Math.round(this.plan().total / this.capacity() * 100)
      : 0,
  );

  readonly periodHours = computed<number | null>(() => {
    const start = this.startDate();
    const end = this.endDate();

    if (!start || !end || end < start) return null;

    const startMs = Date.parse(start + "T00:00:00Z");
    const endMs = Date.parse(end + "T00:00:00Z");

    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return null;
    }

    const dayCount = Math.round((endMs - startMs) / 86400000) + 1;
    const weeks = Math.floor(dayCount / 7);
    const remainder = dayCount % 7;
    const firstWeekday = new Date(startMs).getUTCDay();

    let total = weeks * this.plan().total;

    for (let offset = 0; offset < remainder; offset++) {
      const weekday = (firstWeekday + offset) % 7;
      if (weekday >= 1 && weekday <= 5) {
        total += this.plan().loads[weekday - 1];
      }
    }

    return total;
  });

  readonly errors = computed(() => {
    const result: string[] = [];

    for (const day of this.days()) {
      if (!day.enabled) continue;

      const from = this.minutes(day.start);
      const to = this.minutes(day.end);

      if (
        !Number.isFinite(from) ||
        !Number.isFinite(to) ||
        to <= from ||
        from % 30 !== 0 ||
        to % 30 !== 0
      ) {
        result.push(
          `Revisa la jornada de ${day.name}; usa horas válidas en intervalos de 30 minutos.`,
        );
      }
    }

    for (const subject of this.subjects()) {
      const hours = Number(subject.hours);

      if (
        subject.hours.trim() === "" ||
        !Number.isFinite(hours) ||
        hours <= 0 ||
        hours * 2 % 1 !== 0
      ) {
        result.push(
          `La carga de ${subject.name || "una materia"} debe ser positiva y múltiplo de 0.5 horas.`,
        );
      }
    }

    if (this.startDate() && this.endDate()) {
      if (this.endDate() < this.startDate() || this.periodHours() === null) {
        result.push("El período de fechas no es válido.");
      }
    }

    return result;
  });

  updateDay(index: number, field: "enabled" | "start" | "end", value: string | boolean): void {
    this.days.update(days =>
      days.map((day, i) =>
        i === index ? { ...day, [field]: value } : day,
      ),
    );
  }

  updateSubject(id: number, field: "name" | "hours", value: string): void {
    this.subjects.update(subjects =>
      subjects.map(subject =>
        subject.id === id ? { ...subject, [field]: value } : subject,
      ),
    );
  }

  addSubject(): void {
    const id = this.nextSubjectId++;
    this.subjects.update(subjects => [
      ...subjects,
      { id, name: `Materia ${id}`, hours: "8" },
    ]);
  }

  removeSubject(id: number): void {
    if (this.subjects().length <= 1) return;
    this.subjects.update(subjects =>
      subjects.filter(subject => subject.id !== id),
    );
  }

  loadExample(count: number, hours: number): void {
    this.subjects.set(this.exampleSubjects(count, hours));
    this.nextSubjectId = count + 1;
  }

  maxSubjects(hours: number): number {
    return Math.floor(this.capacity() / hours);
  }

  private defaultDays(): WorkingDay[] {
    return ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(
      (name, id) => ({
        id,
        name,
        enabled: true,
        start: "07:00",
        end: "17:00",
      }),
    );
  }

  private exampleSubjects(count: number, hours: number): Subject[] {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      name: `Materia ${index + 1}`,
      hours: String(hours),
    }));
  }

  private minutes(value: string): number {
    if (!/^\d{2}:\d{2}$/.test(value)) return NaN;

    const [hours, minutes] = value.split(":").map(Number);

    if (hours > 23 || minutes > 59) return NaN;

    return hours * 60 + minutes;
  }

  private clock(minutes: number): string {
    return (
      String(Math.floor(minutes / 60)).padStart(2, "0") +
      ":" +
      String(minutes % 60).padStart(2, "0")
    );
  }
  readonly authorizationLoading = signal(false);
  readonly authorizationError = signal<string | null>(null);
  readonly authorizationMessage = signal<string | null>(null);

  readonly excelLoading = signal(false);
  readonly excelError = signal<string | null>(null);

  readonly saving = signal(false);
  readonly saveMessage = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);

  readonly savedSchedules = signal<SavedSchedule[]>([]);
  readonly savedLoading = signal(false);
  readonly savedError = signal<string | null>(null);

  readonly savedDetail = signal<SavedScheduleDetail | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);

  chooseGroup(id: string): void {
    this.groupId.set(id);
    this.clearSavedView();

    if (id) {
      void this.refreshSaved();
    }
  }

  private clearSavedView(): void {
    this.savedSchedules.set([]);
    this.savedDetail.set(null);
    this.savedError.set(null);
    this.detailError.set(null);
    this.saveMessage.set(null);
    this.saveError.set(null);
  }

  async saveDraft(): Promise<void> {
    if (this.saving()) return;

    this.saveError.set(null);
    this.saveMessage.set(null);

    const group = this.groupId();
    const subjects = this.subjects();
    const days = this.days();
    const schedule = this.plan();

    if (!this.programId() || !this.cohortId() || !group) {
      this.saveError.set(
        "Selecciona programa, generación y grupo institucional.",
      );
      return;
    }

    if (
      !this.startDate() ||
      !this.endDate() ||
      this.endDate() < this.startDate() ||
      this.periodHours() === null
    ) {
      this.saveError.set("Selecciona un período de fechas válido.");
      return;
    }

    if (this.errors().length > 0 || this.pending() !== 0) {
      this.saveError.set(
        "Corrige las jornadas y completa las horas semanales antes de guardar.",
      );
      return;
    }

    const names = subjects.map(subject => subject.name.trim());
    const normalizedNames = names.map(name => name.toLocaleLowerCase());

    if (
      names.some(name => !name || /^Materia\s+\d+$/i.test(name)) ||
      new Set(normalizedNames).size !== subjects.length
    ) {
      this.saveError.set(
        "Sustituye las materias de ejemplo por nombres reales y distintos.",
      );
      return;
    }

    const totalHours = subjects.reduce(
      (total, subject) => total + Number(subject.hours),
      0,
    );

    if (
      !Number.isFinite(totalHours) ||
      totalHours <= 0 ||
      totalHours !== schedule.total
    ) {
      this.saveError.set(
        "Las horas programadas deben coincidir con la carga solicitada.",
      );
      return;
    }

    const subjectKeys = new Map<string, string>();

    subjects.forEach(subject => {
      subjectKeys.set(subject.name.trim(), String(subject.id));
    });

    const bloques = schedule.blocks.flatMap((dayBlocks, index) =>
      dayBlocks.map(block => ({
        clave_materia: subjectKeys.get(block.subject) ?? "",
        dia_semana: index + 1,
        hora_inicio: block.start,
        hora_fin: block.end,
      })),
    );

    if (bloques.some(block => !block.clave_materia)) {
      this.saveError.set(
        "No se pudo relacionar un bloque con su materia.",
      );
      return;
    }

    const body = {
      id_grupo: group,
      vigente_desde: this.startDate(),
      vigente_hasta: this.endDate(),
      jornadas: days.map((day, index) => ({
        dia_semana: index + 1,
        habilitado: day.enabled,
        hora_inicio: day.start,
        hora_fin: day.end,
      })),
      materias: subjects.map(subject => ({
        clave: String(subject.id),
        codigo: null,
        nombre: subject.name.trim(),
        horas_semanales: Number(subject.hours),
      })),
      bloques,
    };

    this.saving.set(true);

    try {
      const result = await firstValueFrom(
        this.http.post<{
          data: { id_horario: string; estado: string };
          message: string;
        }>("/api/academico/horarios", body),
      );

      this.saveMessage.set(
        "Borrador guardado. Identificador: " + result.data.id_horario,
      );

      await this.refreshSaved();

      if (this.groupId() === group) {
        await this.viewSaved(result.data.id_horario);
      }
    } catch (error: unknown) {
      this.saveError.set(
        this.httpMessage(error, "No fue posible guardar el horario."),
      );
    } finally {
      this.saving.set(false);
    }
  }

  async refreshSaved(): Promise<void> {
    const group = this.groupId();

    this.savedSchedules.set([]);
    this.savedDetail.set(null);
    this.savedError.set(null);

    if (!group) return;

    this.savedLoading.set(true);

    try {
      const records = await this.fetchAll<SavedSchedule>(
        "/api/academico/horarios?id_grupo=" +
        encodeURIComponent(group),
      );

      if (this.groupId() === group) {
        this.savedSchedules.set(records);
      }
    } catch (error: unknown) {
      if (this.groupId() === group) {
        this.savedError.set(
          this.httpMessage(error, "No fue posible consultar horarios."),
        );
      }
    } finally {
      this.savedLoading.set(false);
    }
  }

  async viewSaved(id: string): Promise<void> {
    const group = this.groupId();

    this.savedDetail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.http.get<{ data: SavedScheduleDetail }>(
          "/api/academico/horarios/" + encodeURIComponent(id),
        ),
      );

      if (
        this.groupId() === group &&
        response.data.horario.id_grupo === group
      ) {
        this.savedDetail.set(response.data);
      }
    } catch (error: unknown) {
      if (this.groupId() === group) {
        this.detailError.set(
          this.httpMessage(error, "No fue posible recuperar el horario."),
        );
      }
    } finally {
      this.detailLoading.set(false);
    }
  }

  loadSavedAsNewVersion(detail: SavedScheduleDetail): void {
    const horario = detail.horario;

    if (
      !this.groupId() ||
      horario.id_grupo !== this.groupId() ||
      !this.programId() ||
      !this.cohortId()
    ) {
      this.saveError.set(
        "El horario recuperado no corresponde al grupo institucional seleccionado.",
      );
      return;
    }

    if (
      !Array.isArray(horario.jornadas) ||
      horario.jornadas.length !== 5 ||
      !Array.isArray(detail.materias) ||
      detail.materias.length === 0
    ) {
      this.saveError.set(
        "La versión no contiene las cinco jornadas o las materias necesarias.",
      );
      return;
    }

    const originalDays = this.defaultDays();
    const dayNumbers = horario.jornadas.map(day => Number(day.dia_semana));

    if (
      new Set(dayNumbers).size !== 5 ||
      dayNumbers.some(day => !Number.isInteger(day) || day < 1 || day > 5)
    ) {
      this.saveError.set("Las jornadas guardadas no son válidas.");
      return;
    }

    const days: WorkingDay[] = originalDays.map((base, index) => {
      const saved = horario.jornadas.find(
        day => Number(day.dia_semana) === index + 1,
      )!;

      return {
        ...base,
        enabled: saved.habilitado === true,
        start: String(saved.hora_inicio).slice(0, 5),
        end: String(saved.hora_fin).slice(0, 5),
      };
    });

    const subjects: Subject[] = detail.materias.map((saved, index) => ({
      id: index + 1,
      name: saved.nombre_materia,
      hours: String(saved.horas_semanales),
    }));

    if (
      subjects.some(
        subject =>
          !subject.name.trim() ||
          !Number.isFinite(Number(subject.hours)) ||
          Number(subject.hours) <= 0,
      ) ||
      days.some(
        day =>
          !/^\d{2}:\d{2}$/.test(day.start) ||
          !/^\d{2}:\d{2}$/.test(day.end),
      )
    ) {
      this.saveError.set(
        "La versión contiene jornadas o materias que requieren revisión.",
      );
      return;
    }

    const desde = String(horario.vigente_desde).slice(0, 10);
    const hasta = String(horario.vigente_hasta).slice(0, 10);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(desde) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(hasta) ||
      hasta < desde
    ) {
      this.saveError.set("El período guardado no es válido.");
      return;
    }

    this.days.set(days);
    this.subjects.set(subjects);
    this.nextSubjectId = subjects.length + 1;
    this.startDate.set(desde);
    this.endDate.set(hasta);

    this.saveError.set(null);
    this.saveMessage.set(
      "Versión " +
        horario.version +
        " cargada en el editor. Revisa la nueva distribución de bloques " +
        "y guarda como borrador cuando esté completa. " +
        "La versión original no se ha modificado.",
    );
  }

  async authorizeSavedVersion(id: string, version: number): Promise<void> {
    if (this.authorizationLoading()) return;

    const detail = this.savedDetail();

    if (
      !detail ||
      detail.horario.id_horario !== id ||
      detail.horario.version !== version ||
      detail.horario.estado !== "BORRADOR" ||
      detail.horario.id_grupo !== this.groupId()
    ) {
      this.authorizationError.set(
        "Selecciona una versión en borrador perteneciente al grupo actual.",
      );
      return;
    }

    const confirmed = window.confirm(
      "¿Autorizar institucionalmente la versión " +
        version +
        " del horario? Esta acción la marcará como VIGENTE y " +
        "sustituirá la versión vigente anterior del mismo grupo y período.",
    );

    if (!confirmed) return;

    this.authorizationError.set(null);
    this.authorizationMessage.set(null);
    this.authorizationLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.http.post<{
          data: {
            id_horario: string;
            version: number;
            estado: string;
          };
          message: string;
        }>(
          "/api/academico/horarios/" +
            encodeURIComponent(id) +
            "/autorizar",
          {},
        ),
      );

      if (
        response.data.id_horario !== id ||
        response.data.version !== version ||
        response.data.estado !== "VIGENTE"
      ) {
        throw new Error(
          "La respuesta del servidor no confirmó la versión autorizada.",
        );
      }

      await this.refreshSaved();

      if (this.groupId() === detail.horario.id_grupo) {
        await this.viewSaved(id);
        this.authorizationMessage.set(
          "Versión " + version + " autorizada institucionalmente.",
        );
      }
    } catch (error: unknown) {
      this.authorizationError.set(
        this.httpMessage(
          error,
          "No fue posible autorizar la versión seleccionada.",
        ),
      );
    } finally {
      this.authorizationLoading.set(false);
    }
  }

  async downloadSavedExcel(id: string, version: number): Promise<void> {
    if (this.excelLoading()) return;

    this.excelError.set(null);
    this.excelLoading.set(true);

    try {
      const blob = await firstValueFrom(
        this.http.get(
          "/api/academico/horarios/" +
            encodeURIComponent(id) +
            "/excel",
          { responseType: "blob" },
        ),
      );

      if (blob.size === 0) {
        throw new Error("El servidor devolvió un archivo vacío.");
      }

      const fileName =
        "horario_" +
        id.replace(/[^a-zA-Z0-9-]/g, "") +
        "_v" +
        String(version) +
        ".xlsx";

      const objectUrl = URL.createObjectURL(blob);

      try {
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);

        try {
          anchor.click();
        } finally {
          anchor.remove();
        }
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      }
    } catch (error: unknown) {
      this.excelError.set(
        this.httpMessage(
          error,
          "No fue posible descargar el Excel del horario guardado.",
        ),
      );
    } finally {
      this.excelLoading.set(false);
    }
  }

  dayLabel(day: number): string {
    return [
      "Sin día", "Lunes", "Martes", "Miércoles",
      "Jueves", "Viernes",
    ][day] ?? "Día inválido";
  }

  savedSubjectName(
    detail: SavedScheduleDetail,
    id: string,
  ): string {
    return detail.materias.find(
      subject => subject.id_materia_horario === id,
    )?.nombre_materia ?? "Materia no identificada";
  }

  private httpMessage(error: unknown, fallback: string): string {
    if (
      error instanceof HttpErrorResponse &&
      (error.status === 401 || error.status === 403)
    ) {
      return "La sesión no tiene autorización para esta operación.";
    }

    if (error instanceof HttpErrorResponse && error.status === 422) {
      return "El servidor rechazó los datos del horario. Revisa el período, las materias y los bloques.";
    }

    return fallback;
  }

  // SIGA_R05_I03_A10B
  private readonly a10Auth =
    injectScheduleCode(ScheduleCodeAuthService);

  readonly a10ReauthBusy = scheduleCodeSignal(false);
  readonly a10Reauthenticated = scheduleCodeSignal(false);
  readonly a10Saving = scheduleCodeSignal<string | null>(null);
  readonly a10Message = scheduleCodeSignal("");
  readonly a10Error = scheduleCodeSignal("");

  async a10Reautenticar(
    input: HTMLInputElement,
  ): Promise<void> {
    if (this.a10ReauthBusy()) return;

    const password = input.value;
    input.value = "";

    this.a10Error.set("");
    this.a10Message.set("");
    this.a10Reauthenticated.set(false);

    if (!password) {
      this.a10Error.set("Introduce tu contraseña institucional.");
      return;
    }

    this.a10ReauthBusy.set(true);

    try {
      await firstValueFrom(
        this.a10Auth.reauthenticate(password),
      );

      this.a10Reauthenticated.set(true);
      this.a10Message.set(
        "Reautenticación confirmada por el servidor.",
      );
    } catch {
      this.a10Error.set(
        "No se pudo confirmar la reautenticación.",
      );
    } finally {
      this.a10ReauthBusy.set(false);
    }
  }

  async a10GuardarClave(
    horarioId: string,
    materiaId: string,
    valor: string,
  ): Promise<void> {
    if (this.a10Saving() !== null) return;

    this.a10Error.set("");
    this.a10Message.set("");

    const detalle = this.savedDetail();
    const codigo = valor.trim();

    if (
      !this.a10Reauthenticated() ||
      detalle?.horario.id_horario !== horarioId ||
      detalle.horario.estado !== "BORRADOR" ||
      !detalle.materias.some(
        (materia) => materia.id_materia_horario === materiaId,
      )
    ) {
      this.a10Error.set(
        "Selecciona un borrador y reautentícate.",
      );
      return;
    }

    if (!/^[A-Z0-9._-]{1,40}$/.test(codigo)) {
      this.a10Error.set(
        "La clave debe contener solo A-Z, 0-9, " +
        "punto, guion o guion bajo.",
      );
      return;
    }

    this.a10Saving.set(materiaId);
    let guardadoConfirmado = false;

    try {
      await firstValueFrom(
        this.http.patch(
          "/api/academico/horarios/" +
            encodeURIComponent(horarioId) +
            "/materias/" +
            encodeURIComponent(materiaId) +
            "/codigo",
          { codigo },
        ),
      );

      guardadoConfirmado = true;

      const actualizado = await firstValueFrom(
        this.http.get<{ data: SavedScheduleDetail }>(
          "/api/academico/horarios/" +
            encodeURIComponent(horarioId),
        ),
      );

      if (
        this.savedDetail()?.horario.id_horario === horarioId
      ) {
        this.savedDetail.set(actualizado.data);
      }

      this.a10Message.set(
        "Clave institucional guardada y detalle actualizado.",
      );
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status;

      if (guardadoConfirmado) {
        this.a10Message.set(
          "La clave fue guardada, pero el detalle no pudo " +
          "actualizarse. Consulta nuevamente el horario.",
        );
      } else if (status === 403) {
        this.a10Reauthenticated.set(false);
        this.a10Error.set(
          "Operación denegada. Verifica permisos y reautenticación.",
        );
      } else if (status === 422) {
        this.a10Error.set(
          "La clave fue rechazada por las reglas institucionales.",
        );
      } else if (status === 404) {
        this.a10Error.set(
          "La materia no pertenece al horario seleccionado.",
        );
      } else {
        this.a10Error.set(
          "No fue posible confirmar la corrección.",
        );
      }
    } finally {
      this.a10Saving.set(null);
    }
  }

}
