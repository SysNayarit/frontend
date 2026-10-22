import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { Subscription } from "rxjs";

import {
  PersonImportBatch,
  PersonImportHistoryResponse,
  PersonImportPreviewResponse,
} from "../../../person-import.models";
import {
  PersonImportConfirmationError,
  PersonImportConfirmationService,
} from "../../../person-import-confirmation.service";
import { createPersonReauthenticationForm } from "../../forms/person-reauthentication-form";
import { PersonImportService } from "../../../person-import.service";
import { PersonImportConfirmationFormComponent } from "../../organisms/person-import-confirmation-form/person-import-confirmation-form.component";
import { ModuleNavigationComponent } from "../../molecules/module-navigation/module-navigation.component";
import { PersonImportPreviewComponent } from "../../organisms/person-import-preview/person-import-preview.component";

@Component({
  selector: "app-person-import-page",
  standalone: true,
  imports: [
    RouterLink,
    ModuleNavigationComponent,
    PersonImportPreviewComponent,
    PersonImportConfirmationFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="border-b border-[#a57f2c]/20 bg-[#611232] text-white shadow-md"
    >
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p
          class="text-xs font-semibold uppercase tracking-[0.18em] text-[#e6d194]"
        >
          Módulo Personas
        </p>

        <h1 class="siga-title mt-1 text-3xl font-bold tracking-tight">
          Personas
        </h1>

        <p class="mt-3 text-sm text-white/75">
          Núcleo de identidad de SIGA
        </p>
      </div>
    </section>

    <app-module-navigation currentLabel="Importación de personas" />

    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section
        data-testid="person-import-page"
        class="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
      >
        <div
          class="h-1.5 bg-gradient-to-r from-[#611232] via-[#9b2247] to-[#a57f2c]"
          aria-hidden="true"
        ></div>

        <div class="p-6 sm:p-8">
          <div
            class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <p
                class="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b2247]"
              >
                Importación masiva
              </p>

              <h2 class="siga-title mt-2 text-3xl font-bold text-[#611232]">
                Importar personas
              </h2>

              <p class="mt-4 max-w-3xl leading-7 text-[#555555]">
                Carga, valida y revisa un archivo XLSX antes de confirmar el
                registro masivo de personas.
              </p>
            </div>

            <a
              routerLink="/personas"
              data-testid="person-import-back"
              class="siga-focus inline-flex shrink-0 items-center justify-center rounded-lg border border-[#611232] px-4 py-2.5 text-sm font-semibold text-[#611232] transition hover:bg-[#611232]/5"
            >
              Volver a Personas
            </a>
          </div>

          <div class="mt-8 border-t border-gray-200 pt-8">
            <div class="max-w-2xl">
              <label
                for="person-import-file"
                class="block text-sm font-semibold text-[#611232]"
              >
                Archivo de personas
              </label>

              <p
                id="person-import-file-help"
                class="mt-2 text-sm text-[#555555]"
              >
                Selecciona un archivo Excel con extensión .xlsx.
              </p>

              <input
                id="person-import-file"
                data-testid="person-import-file"
                type="file"
                accept=".xlsx"
                [disabled]="isUploading()"
                aria-describedby="person-import-file-help"
                (change)="onFileSelected($event)"
                class="siga-focus mt-4 block w-full rounded-lg border border-gray-300 p-3 text-sm text-[#333333] file:mr-4 file:rounded-lg file:border-0 file:bg-[#611232] file:px-4 file:py-2 file:font-semibold file:text-white"
              />

              @if (selectedFile(); as file) {
                <div
                  data-testid="person-import-selected-file"
                  class="mt-4 rounded-lg border border-[#a57f2c]/30 bg-[#a57f2c]/5 p-4"
                >
                  <p class="text-sm font-semibold text-[#611232]">
                    Archivo seleccionado
                  </p>

                  <p class="mt-1 break-all text-sm text-[#333333]">
                    {{ file.name }}
                  </p>
                </div>
              }

              <button
                type="button"
                data-testid="person-import-upload"
                [disabled]="!selectedFile() || isUploading()"
                (click)="upload()"
                class="siga-focus mt-6 inline-flex items-center justify-center rounded-lg bg-[#611232] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4e0e28] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ isUploading() ? "Cargando archivo..." : "Cargar y validar" }}
              </button>

              @if (errorMessage(); as message) {
                <div
                  data-testid="person-import-error"
                  role="alert"
                  class="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                  {{ message }}
                </div>
              }
            </div>
          </div>

          <section
            data-testid="person-import-history"
            class="mt-8 border-t border-gray-200 pt-8"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 class="siga-title text-xl font-bold text-[#611232]">
                  Historial de importaciones
                </h3>
                <p class="mt-2 text-sm text-[#555555]">
                  Consulta los archivos cargados anteriormente por fecha y hora.
                </p>
              </div>

              <button
                type="button"
                data-testid="person-import-history-refresh"
                [disabled]="historyLoading() || isUploading() || isConfirming()"
                (click)="loadHistory()"
                class="siga-focus rounded-lg border border-[#611232] px-4 py-2 text-sm font-semibold text-[#611232] disabled:opacity-50"
              >
                Actualizar historial
              </button>
            </div>

            @if (historyLoading()) {
              <p class="mt-4 text-sm text-[#555555]" role="status">
                Consultando importaciones anteriores...
              </p>
            }

            @if (historyError(); as message) {
              <p class="mt-4 text-sm text-red-700" role="alert">
                {{ message }}
              </p>
            }

            @if (history(); as result) {
              @if (result.data.length === 0) {
                <p
                  data-testid="person-import-history-empty"
                  class="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-[#555555]"
                >
                  Aún no hay importaciones para mostrar.
                </p>
              } @else {
                <div class="mt-4 space-y-3">
                  @for (item of result.data; track item.uuid) {
                    <div
                      data-testid="person-import-history-item"
                      class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors duration-500 motion-reduce:transition-none hover:bg-blue-50"
                      [class.border-blue-500]="selectedHistoryUuid() === item.uuid"
                      [class.bg-blue-50]="selectedHistoryUuid() === item.uuid"
                      [class.border-l-4]="selectedHistoryUuid() === item.uuid"
                      [class.border-l-blue-600]="selectedHistoryUuid() === item.uuid"
                    >
                      <div class="min-w-0 flex-1">
                        <p class="break-words font-semibold text-[#611232]">
                          {{ item.original_filename }}
                        </p>
                        <p class="mt-1 text-sm text-[#555555]">
                          Archivo recibido: {{ historyDate(item.created_at) }}
                        </p>

                        @if (item.confirmed_at) {
                          <p class="mt-1 text-sm text-[#555555]">
                            Carga confirmada: {{ historyDate(item.confirmed_at) }}
                          </p>
                        }

                        @if (item.finished_at) {
                          <p class="mt-1 text-sm font-medium text-[#1e5b4f]">
                            Procesamiento finalizado:
                            {{ historyDate(item.finished_at) }}
                          </p>
                        }
                        <div class="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            class="rounded-full px-3 py-1 text-xs font-semibold"
                            [class.bg-amber-100]="item.status === 'READY' && item.invalid_rows > 0"
                            [class.text-amber-900]="item.status === 'READY' && item.invalid_rows > 0"
                            [class.bg-blue-100]="item.status === 'READY' && item.invalid_rows === 0 || item.status === 'QUEUED' || item.status === 'PROCESSING'"
                            [class.text-blue-900]="item.status === 'READY' && item.invalid_rows === 0 || item.status === 'QUEUED' || item.status === 'PROCESSING'"
                            [class.bg-green-100]="item.status === 'COMPLETED' && item.failed_rows === 0"
                            [class.text-green-900]="item.status === 'COMPLETED' && item.failed_rows === 0"
                            [class.bg-red-100]="item.status === 'FAILED' || item.status === 'COMPLETED' && item.failed_rows > 0"
                            [class.text-red-900]="item.status === 'FAILED' || item.status === 'COMPLETED' && item.failed_rows > 0"
                          >
                            {{ historyIndicator(item) }}
                          </span>

                          <span class="text-xs text-[#555555]">
                            {{ item.total_rows }} registros
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        data-testid="person-import-history-consult"
                        [attr.aria-expanded]="expandedHistoryUuid() === item.uuid"
                        [disabled]="isUploading() || isConfirming()"
                        (click)="consultHistory(item.uuid)"
                        class="siga-focus shrink-0 rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4e0e28] disabled:opacity-50"
                      >
                        {{
                          expandedHistoryUuid() === item.uuid
                            ? "Cerrar resultados"
                            : "Consultar resultados"
                        }}
                      </button>

                      @if (expandedHistoryUuid() === item.uuid) {
                        <div
                          data-testid="person-import-history-expanded"
                          class="w-full overflow-hidden border-t border-blue-200 pt-4"
                        >
                          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div class="rounded-lg bg-gray-50 p-3">
                              <p class="text-xs text-gray-600">Total</p>
                              <p class="text-xl font-bold">{{ item.total_rows }}</p>
                            </div>
                            <div class="rounded-lg bg-green-50 p-3">
                              <p class="text-xs text-green-800">Procesadas</p>
                              <p class="text-xl font-bold text-green-800">
                                {{ item.processed_rows }}
                              </p>
                            </div>
                            <div class="rounded-lg bg-red-50 p-3">
                              <p class="text-xs text-red-800">Fallidas</p>
                              <p class="text-xl font-bold text-red-800">
                                {{ item.failed_rows }}
                              </p>
                            </div>
                            <div class="rounded-lg bg-amber-50 p-3">
                              <p class="text-xs text-amber-900">Con observaciones</p>
                              <p class="text-xl font-bold text-amber-900">
                                {{ item.invalid_rows }}
                              </p>
                            </div>
                          </div>

                          @if (isPreviewLoading()) {
                            <p role="status" class="mt-4 text-sm text-blue-800">
                              Consultando registros del archivo...
                            </p>
                          }

                          @if (recoveryError(); as message) {
                            <p role="alert" class="mt-4 text-sm text-red-800">
                              {{ message }}
                            </p>
                          }

                          @if (preview(); as result) {
                            @if (result.data.uuid === item.uuid) {
                              <app-person-import-preview
                                [preview]="result"
                                (pageChange)="loadPreview($event)"
                              />
                            }
                          }
                        </div>
                      }
                    </div>
                  }
                </div>

                <nav
                  aria-label="Paginación del historial"
                  class="mt-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <p class="text-sm text-[#555555]">
                    Página {{ result.meta.current_page }}
                    de {{ result.meta.last_page }}
                  </p>

                  <div class="flex gap-2">
                    <button
                      type="button"
                      [disabled]="result.meta.current_page <= 1 || historyLoading()"
                      (click)="loadHistory(result.meta.current_page - 1)"
                      class="siga-focus rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      [disabled]="result.meta.current_page >= result.meta.last_page || historyLoading()"
                      (click)="loadHistory(result.meta.current_page + 1)"
                      class="siga-focus rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>
                </nav>
              }
            }

            @if (recoveryError(); as message) {
              <p
                data-testid="person-import-recovery-error"
                role="alert"
                class="mt-4 text-sm font-semibold text-red-700"
              >
                {{ message }}
              </p>
            }
          </section>
          @if (batch(); as result) {
            <section
              data-testid="person-import-summary"
              aria-labelledby="person-import-summary-title"
              class="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5 sm:p-6"
            >
              <h3
                id="person-import-summary-title"
                class="siga-title text-xl font-bold text-[#611232]"
              >
                Resumen del lote
              </h3>

              <dl class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt class="text-sm text-[#555555]">Archivo</dt>
                  <dd class="mt-1 break-all font-semibold text-[#333333]">
                    {{ result.original_filename }}
                  </dd>
                </div>

                <div>
                  <dt class="text-sm text-[#555555]">Identificador del lote</dt>
                  <dd class="mt-1 break-all font-semibold text-[#333333]">
                    {{ result.uuid }}
                  </dd>
                </div>

                <div>
                  <dt class="text-sm text-[#555555]">Estado</dt>
                  <dd class="mt-1 font-semibold text-[#333333]">
                    {{ result.status }}
                  </dd>
                </div>

                <div>
                  <dt class="text-sm text-[#555555]">Filas totales</dt>
                  <dd class="mt-1 font-semibold text-[#333333]">
                    {{ result.total_rows }}
                  </dd>
                </div>

                <div>
                  <dt class="text-sm text-[#555555]">Filas válidas</dt>
                  <dd class="mt-1 font-semibold text-[#333333]">
                    {{ result.valid_rows }}
                  </dd>
                </div>

                <div>
                  <dt class="text-sm text-[#555555]">Filas inválidas</dt>
                  <dd class="mt-1 font-semibold text-[#333333]">
                    {{ result.invalid_rows }}
                  </dd>
                </div>
              </dl>
            </section>
          }

          @if (batch(); as currentBatch) {
            @if (
              currentBatch.status === "READY" &&
              currentBatch.valid_rows > 0 &&
              !confirmationFormOpen()
            ) {
              <div class="mt-6">
                <button
                  type="button"
                  data-testid="person-import-open-confirmation"
                  [disabled]="isUploading() || isConfirming()"
                  (click)="openConfirmationForm()"
                  class="siga-focus rounded-lg bg-[#1e5b4f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17473e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Confirmar lote
                </button>
              </div>
            }

            @if (confirmationFormOpen()) {
              <app-person-import-confirmation-form
                [form]="confirmationForm"
                [batch]="currentBatch"
                [busy]="isConfirming()"
                [passwordError]="confirmationPasswordError()"
                [errorMessage]="confirmationError()"
                (submitRequested)="submitConfirmation()"
                (cancelRequested)="cancelConfirmationForm()"
              />
            }
          }

          @if (confirmationSuccess(); as message) {
            <div
              data-testid="person-import-confirmation-success"
              role="status"
              class="mt-6 rounded-lg border border-[#1e5b4f]/30 bg-[#1e5b4f]/5 p-4 text-sm font-semibold text-[#1e5b4f]"
            >
              {{ message }}
            </div>
          }

          @if (isPreviewLoading()) {
            <p
              data-testid="person-import-preview-loading"
              role="status"
              class="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-[#555555]"
            >
              Consultando vista previa del lote...
            </p>
          }

          @if (previewError(); as message) {
            <div
              data-testid="person-import-preview-error"
              role="alert"
              class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              {{ message }}
            </div>
          }

          @if (expandedHistoryUuid() === null) {
            @if (preview(); as result) {
              <app-person-import-preview
                [preview]="result"
                (pageChange)="loadPreview($event)"
              />
            }
          }
        </div>
      </section>
    </div>
  `,
})
export class PersonImportPageComponent implements OnInit {
  readonly history = signal<PersonImportHistoryResponse | null>(null);
  readonly selectedHistoryUuid = signal<string | null>(null);
  readonly expandedHistoryUuid = signal<string | null>(null);
  readonly historyLoading = signal(false);
  readonly historyError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(page = 1): void {
    if (
      this.historyLoading() ||
      !Number.isInteger(page) ||
      page < 1
    ) {
      return;
    }

    this.historyLoading.set(true);
    this.historyError.set(null);

    this.importService
      .getHistory(page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.history.set(response);
        },
        error: () => {
          this.historyLoading.set(false);
          this.historyError.set(
            "No fue posible consultar el historial de importaciones.",
          );
        },
        complete: () => {
          this.historyLoading.set(false);
        },
      });
  }

  consultHistory(uuid: string): void {
    if (this.isUploading() || this.isConfirming()) {
      return;
    }

    this.selectedHistoryUuid.set(uuid);

    if (this.expandedHistoryUuid() === uuid) {
      this.expandedHistoryUuid.set(null);
      this.clearPreview();
      this.batch.set(null);
      this.cancelConfirmationForm();
      return;
    }

    // Cancelar la consulta anterior antes de cambiar de lote.
    this.clearPreview();
    this.expandedHistoryUuid.set(uuid);
    this.recoveryUuid.set(uuid);
    this.recoverBatch();
  }

  historyIndicator(item: PersonImportHistoryResponse["data"][number]): string {
    if (item.status === "COMPLETED") {
      return item.failed_rows > 0
        ? "Cargado con incidencias"
        : "Cargado";
    }

    if (item.status === "FAILED") {
      return "Error de procesamiento";
    }

    if (item.status === "READY") {
      return item.invalid_rows > 0
        ? "Con observaciones"
        : "Listo para cargar";
    }

    if (item.status === "PROCESSING") {
      return "Procesando";
    }

    if (item.status === "QUEUED") {
      return "En espera de procesamiento";
    }

    if (item.status === "VALIDATING") {
      return "Validando";
    }

    if (item.status === "CANCELLED") {
      return "Cancelado";
    }

    return "Archivo recibido";
  }
  historyDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Fecha no disponible";
    }

    return new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  historyStatus(status: PersonImportBatch["status"]): string {
    switch (status) {
      case "COMPLETED": return "Completada";
      case "READY": return "Lista para confirmar";
      case "QUEUED": return "En espera de procesamiento";
      case "PROCESSING": return "En procesamiento";
      case "FAILED": return "Con errores";
      case "CANCELLED": return "Cancelada";
      case "VALIDATING": return "Validando";
      case "UPLOADED": return "Archivo recibido";
    }
  }
  private readonly importService = inject(PersonImportService);
  private readonly confirmationService = inject(
    PersonImportConfirmationService,
  );
  private readonly destroyRef = inject(DestroyRef);

  readonly confirmationForm = createPersonReauthenticationForm();
  readonly confirmationFormOpen = signal(false);
  readonly isConfirming = signal(false);
  readonly confirmationPasswordError = signal<string | null>(null);
  readonly confirmationError = signal<string | null>(null);
  readonly confirmationSuccess = signal<string | null>(null);
  readonly recoveryUuid = signal("");
  readonly recoveryError = signal<string | null>(null);

  readonly selectedFile = signal<File | null>(null);
  readonly isUploading = signal(false);
  readonly batch = signal<PersonImportBatch | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly preview = signal<PersonImportPreviewResponse | null>(null);
  readonly isPreviewLoading = signal(false);
  readonly previewError = signal<string | null>(null);

  private previewSubscription: Subscription | null = null;

  openConfirmationForm(): void {
    const currentBatch = this.batch();

    if (
      this.isConfirming() ||
      this.isUploading() ||
      !currentBatch ||
      currentBatch.status !== "READY" ||
      currentBatch.valid_rows < 1
    ) {
      return;
    }

    this.confirmationForm.reset();
    this.confirmationPasswordError.set(null);
    this.confirmationError.set(null);
    this.confirmationSuccess.set(null);
    this.confirmationFormOpen.set(true);
  }

  submitConfirmation(): void {
    const currentBatch = this.batch();

    if (
      !this.confirmationFormOpen() ||
      this.isConfirming() ||
      !currentBatch ||
      currentBatch.status !== "READY" ||
      currentBatch.valid_rows < 1
    ) {
      return;
    }

    this.confirmationPasswordError.set(null);
    this.confirmationError.set(null);

    const password = this.confirmationForm.controls.password.value;

    if (password.trim() === "") {
      this.confirmationPasswordError.set(
        "La contraseña es obligatoria.",
      );
      return;
    }

    this.isConfirming.set(true);

    this.confirmationService
      .confirm(currentBatch.uuid, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.confirmationForm.reset();

          if (response.data.status !== "QUEUED") {
            this.confirmationError.set(
              "El backend no confirmó el envío del lote a la cola.",
            );
            return;
          }

          this.batch.set(response.data);

          this.confirmationPasswordError.set(null);
          this.confirmationError.set(null);
          this.confirmationFormOpen.set(false);
          this.confirmationSuccess.set(
            "El lote fue enviado a la cola de procesamiento. " +
              "Consulta su estado para verificar los resultados.",
          );
        },
        error: (error: unknown) => {
          this.confirmationForm.reset();

          if (
            error instanceof PersonImportConfirmationError &&
            error.stage === "reauthentication"
          ) {
            this.confirmationPasswordError.set(
              "No fue posible verificar la contraseña.",
            );
            this.isConfirming.set(false);
            return;
          }

          const originalError =
            error instanceof PersonImportConfirmationError
              ? error.originalError
              : error;

          const status =
            originalError !== null &&
            typeof originalError === "object" &&
            "status" in originalError
              ? originalError.status
              : undefined;

          this.confirmationError.set(
            status === 423
              ? "Se requiere una reautenticación reciente."
              : "No fue posible confirmar el lote.",
          );

          this.isConfirming.set(false);
        },
        complete: () => {
          this.isConfirming.set(false);
        },
      });
  }

  cancelConfirmationForm(): void {
    if (this.isConfirming()) {
      return;
    }

    this.confirmationForm.reset();
    this.confirmationPasswordError.set(null);
    this.confirmationError.set(null);
    this.confirmationFormOpen.set(false);
  }

  onRecoveryUuidChanged(event: Event): void {
    const input = event.target;

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    this.recoveryUuid.set(input.value);
  }

  recoverBatch(): void {
    const uuid = this.recoveryUuid().trim();

    if (!uuid || this.isUploading() || this.isPreviewLoading() || this.isConfirming()) {
      return;
    }

    this.cancelConfirmationForm();
    this.confirmationSuccess.set(null);
    this.clearPreview();
    this.batch.set(null);
    this.errorMessage.set(null);
    this.recoveryError.set(null);
    this.selectedFile.set(null);
    this.isPreviewLoading.set(true);

    this.previewSubscription = this.importService
      .getBatch(uuid, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.batch.set(response.data);
          this.preview.set(response);
        },
        error: () => {
          this.isPreviewLoading.set(false);
          this.recoveryError.set(
            "No se pudo recuperar el lote. Verifica su UUID y tus permisos.",
          );
        },
        complete: () => {
          this.isPreviewLoading.set(false);
        },
      });
  }

  onFileSelected(event: Event): void {
    if (this.isUploading() || this.isConfirming()) {
      return;
    }

    const input = event.target;

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const file = input.files?.item(0) ?? null;

    this.cancelConfirmationForm();
    this.confirmationSuccess.set(null);
    this.clearPreview();

    this.batch.set(null);
    this.errorMessage.set(null);
    this.selectedFile.set(null);

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      this.errorMessage.set(
        "Selecciona un archivo válido con extensión .xlsx.",
      );
      return;
    }

    this.selectedFile.set(file);
  }

  upload(): void {
    const file = this.selectedFile();

    if (!file || this.isUploading() || this.isConfirming()) {
      return;
    }

    this.clearPreview();
    this.isUploading.set(true);
    this.errorMessage.set(null);
    this.batch.set(null);

    this.importService
      .upload(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.batch.set(response.data);
          this.loadPreview(1);
        },
        error: () => {
          this.isUploading.set(false);
          this.errorMessage.set(
            "Error al cargar y validar el archivo. Intenta nuevamente.",
          );
        },
        complete: () => {
          this.isUploading.set(false);
        },
      });
  }

  loadPreview(page: number): void {
    const currentBatch = this.batch();

    if (
      !currentBatch ||
      !Number.isInteger(page) ||
      page < 1
    ) {
      return;
    }

    this.clearPreview();
    this.isPreviewLoading.set(true);

    this.previewSubscription = this.importService
      .getBatch(currentBatch.uuid, page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.preview.set(response);
          this.batch.set(response.data);
        },
        error: () => {
          this.isPreviewLoading.set(false);
          this.previewError.set(
            "No se pudo consultar la vista previa del lote.",
          );
        },
        complete: () => {
          this.isPreviewLoading.set(false);
        },
      });
  }

  private clearPreview(): void {
    this.previewSubscription?.unsubscribe();
    this.previewSubscription = null;

    this.preview.set(null);
    this.previewError.set(null);
    this.isPreviewLoading.set(false);
  }
}