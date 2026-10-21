import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";

import { PersonImportBatch } from "../../../person-import.models";
import { PersonImportService } from "../../../person-import.service";
import { ModuleNavigationComponent } from "../../molecules/module-navigation/module-navigation.component";

@Component({
  selector: "app-person-import-page",
  standalone: true,
  imports: [RouterLink, ModuleNavigationComponent],
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
        </div>
      </section>
    </div>
  `,
})
export class PersonImportPageComponent {
  private readonly importService = inject(PersonImportService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedFile = signal<File | null>(null);
  readonly isUploading = signal(false);
  readonly batch = signal<PersonImportBatch | null>(null);
  readonly errorMessage = signal<string | null>(null);

  onFileSelected(event: Event): void {
    if (this.isUploading()) {
      return;
    }

    const input = event.target;

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const file = input.files?.item(0) ?? null;

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

    if (!file || this.isUploading()) {
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set(null);
    this.batch.set(null);

    this.importService
      .upload(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.batch.set(response.data);
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
}