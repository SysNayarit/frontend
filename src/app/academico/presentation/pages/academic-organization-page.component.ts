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

@Component({
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
    </main>
  `,
})
export class AcademicOrganizationPageComponent implements OnInit {
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
}