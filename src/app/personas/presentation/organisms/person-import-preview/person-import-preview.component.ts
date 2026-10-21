import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

import {
  PersonImportPreviewResponse,
  PersonImportRow,
} from "../../../person-import.models";

@Component({
  selector: "app-person-import-preview",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      data-testid="person-import-preview"
      aria-labelledby="person-import-preview-title"
      class="mt-8 rounded-xl border border-gray-200 bg-white p-5 sm:p-6"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3
            id="person-import-preview-title"
            class="siga-title text-xl font-bold text-[#611232]"
          >
            Vista previa de registros
          </h3>

          <p class="mt-2 text-sm text-[#555555]">
            Revisa los registros y sus resultados de validación.
          </p>
        </div>

        <p class="text-sm font-semibold text-[#611232]">
          Total de registros: {{ preview().meta.total }}
        </p>
      </div>

      @if (preview().rows.length === 0) {
        <p
          data-testid="person-import-preview-empty"
          class="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-[#555555]"
        >
          No hay registros para mostrar.
        </p>
      } @else {
        <div class="mt-6 space-y-4">
          @for (row of preview().rows; track row.row_number) {
            <article
              class="rounded-lg border border-gray-200 p-4"
              [attr.data-row-number]="row.row_number"
            >
              <div class="flex flex-wrap items-center gap-3">
                <h4 class="font-semibold text-[#611232]">
                  Fila {{ row.row_number }}
                </h4>

                <span
                  class="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-[#333333]"
                >
                  {{ row.status }}
                </span>
              </div>

              <dl class="mt-4 grid gap-3 sm:grid-cols-2">
                @for (field of fields(row); track field.key) {
                  <div>
                    <dt class="text-xs font-semibold text-[#555555]">
                      {{ field.key }}
                    </dt>

                    <dd class="mt-1 break-words text-sm text-[#333333]">
                      {{ field.value }}
                    </dd>
                  </div>
                }
              </dl>

              @if (validationErrors(row).length > 0) {
                <div
                  class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"
                >
                  <p class="text-sm font-semibold text-red-800">
                    Errores de validación
                  </p>

                  <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">
                    @for (error of validationErrors(row); track $index) {
                      <li>
                        <strong>{{ error.field }}:</strong>
                        {{ error.message }}
                      </li>
                    }
                  </ul>
                </div>
              }
            </article>
          }
        </div>
      }

      <nav
        aria-label="Paginación de vista previa"
        class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-5"
      >
        <p class="text-sm text-[#555555]">
          Página {{ preview().meta.current_page }}
          de {{ preview().meta.last_page }}
        </p>

        <div class="flex items-center gap-3">
          <button
            type="button"
            data-testid="person-import-preview-previous"
            [disabled]="preview().meta.current_page <= 1"
            (click)="changePage(preview().meta.current_page - 1)"
            class="siga-focus rounded-lg border border-[#611232] px-4 py-2 text-sm font-semibold text-[#611232] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>

          <button
            type="button"
            data-testid="person-import-preview-next"
            [disabled]="preview().meta.current_page >= preview().meta.last_page"
            (click)="changePage(preview().meta.current_page + 1)"
            class="siga-focus rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </nav>
    </section>
  `,
})
export class PersonImportPreviewComponent {
  readonly preview = input.required<PersonImportPreviewResponse>();
  readonly pageChange = output<number>();

  fields(
    row: PersonImportRow,
  ): Array<{ key: string; value: string }> {
    const data = row.normalized_data ?? row.raw_data;

    return Object.entries(data).map(([key, value]) => ({
      key,
      value: this.displayValue(value),
    }));
  }

  validationErrors(
    row: PersonImportRow,
  ): Array<{ field: string; message: string }> {
    return Object.entries(row.validation_errors).flatMap(
      ([field, messages]) =>
        messages.map((message) => ({
          field,
          message,
        })),
    );
  }

  changePage(page: number): void {
    const meta = this.preview().meta;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > meta.last_page ||
      page === meta.current_page
    ) {
      return;
    }

    this.pageChange.emit(page);
  }

  private displayValue(value: unknown): string {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    return "—";
  }
}