import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

import {
  PersonImportPreviewResponse,
  PersonImportRow,
  PersonImportRowStatus,
} from "../../../person-import.models";

@Component({
  selector: "app-person-import-preview",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      data-testid="person-import-preview"
      aria-labelledby="person-import-preview-title"
      class="mt-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-6"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3
            id="person-import-preview-title"
            class="siga-title text-xl font-bold text-[#611232]"
          >
            Personas del archivo
          </h3>

          <p class="mt-1 text-sm text-[#555555]">
            Revisa cada persona y consulta sus detalles cuando lo necesites.
          </p>
        </div>

        <span
          class="rounded-full bg-[#611232]/5 px-3 py-1.5 text-sm font-semibold text-[#611232]"
        >
          {{ preview().meta.total }} registros
        </span>
      </div>

      @if (preview().rows.length === 0) {
        <p
          data-testid="person-import-preview-empty"
          class="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-[#555555]"
        >
          No hay registros para mostrar.
        </p>
      } @else {
        <div class="mt-5 overflow-x-auto rounded-lg border border-gray-200">
          <table class="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead class="bg-gray-50 text-[#555555]">
              <tr>
                <th scope="col" class="w-16 px-4 py-3 font-semibold">
                  Fila
                </th>
                <th scope="col" class="px-4 py-3 font-semibold">
                  Persona
                </th>
                <th scope="col" class="px-4 py-3 font-semibold">
                  Validación
                </th>
                <th scope="col" class="w-32 px-4 py-3 font-semibold">
                  Información
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-200">
              @for (row of preview().rows; track row.row_number) {
                <tr [attr.data-row-number]="row.row_number">
                  <td class="px-4 py-3 align-top text-[#555555]">
                    {{ row.row_number }}
                  </td>

                  <td class="px-4 py-3 align-top">
                    <p class="font-semibold text-[#161a1d]">
                      {{ personName(row) }}
                    </p>

                    @if (personIdentifier(row); as identifier) {
                      <p class="mt-1 text-xs text-[#555555]">
                        {{ identifier }}
                      </p>
                    }

                    @if (validationErrors(row).length > 0) {
                      <div
                        class="mt-2 space-y-1 text-xs text-red-800"
                        role="alert"
                      >
                        @for (error of validationErrors(row); track $index) {
                          <p>
                            <strong>{{ error.field }}:</strong>
                            {{ error.message }}
                          </p>
                        }
                      </div>
                    }
                  </td>

                  <td class="px-4 py-3 align-top">
                    <span
                      class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                      [class.bg-green-50]="row.status === 'VALID' || row.status === 'PROCESSED'"
                      [class.text-green-800]="row.status === 'VALID' || row.status === 'PROCESSED'"
                      [class.bg-red-50]="row.status === 'INVALID' || row.status === 'FAILED'"
                      [class.text-red-800]="row.status === 'INVALID' || row.status === 'FAILED'"
                      [class.bg-gray-100]="row.status !== 'VALID' && row.status !== 'PROCESSED' && row.status !== 'INVALID' && row.status !== 'FAILED'"
                      [class.text-gray-700]="row.status !== 'VALID' && row.status !== 'PROCESSED' && row.status !== 'INVALID' && row.status !== 'FAILED'"
                    >
                      {{ statusLabel(row.status) }}
                    </span>

                    <span class="sr-only">
                      Estado técnico: {{ row.status }}
                    </span>
                  </td>

                  <td class="px-4 py-3 align-top">
                    <details class="group">
                      <summary
                        class="siga-focus cursor-pointer rounded text-sm font-semibold text-[#611232] hover:underline"
                      >
                        Ver detalles
                      </summary>

                      <dl class="mt-3 space-y-2">
                        @for (field of fields(row); track field.key) {
                          <div class="border-b border-gray-100 pb-2">
                            <dt class="text-xs font-semibold text-[#555555]">
                              {{ field.key }}
                            </dt>

                            <dd class="mt-1 break-words text-xs text-[#161a1d]">
                              {{ field.value }}
                            </dd>
                          </div>
                        }
                      </dl>
                    </details>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <nav
        aria-label="Paginación de vista previa"
        class="mt-5 flex flex-wrap items-center justify-between gap-3"
      >
        <p class="text-sm text-[#555555]">
          Página {{ preview().meta.current_page }}
          de {{ preview().meta.last_page }}
        </p>

        <div class="flex items-center gap-2">
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

  personName(row: PersonImportRow): string {
    const data = row.normalized_data ?? row.raw_data;

    const name = [
      data["nombres"],
      data["apellido_paterno"],
      data["apellido_materno"],
    ]
      .filter(
        (value): value is string =>
          typeof value === "string" && value.trim() !== "",
      )
      .join(" ");

    return name || "Sin nombre";
  }

  personIdentifier(row: PersonImportRow): string | null {
    const data = row.normalized_data ?? row.raw_data;

    const curp = data["curp"];

    if (typeof curp === "string" && curp.trim() !== "") {
      return `CURP: ${curp}`;
    }

    return null;
  }

  statusLabel(status: PersonImportRowStatus): string {
    switch (status) {
      case "VALID":
        return "Correcta";
      case "INVALID":
        return "Por corregir";
      case "PROCESSED":
        return "Registrada";
      case "FAILED":
        return "No registrada";
      case "SKIPPED":
        return "Omitida";
      case "PENDING":
        return "Pendiente";
      default:
        return status;
    }
  }

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