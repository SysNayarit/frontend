import { HttpClient } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";

interface Incorporacion {
  matricula: string;
  grupo: string;
  generacion: number;
  anio: number;
  tipo: string;
  programa_codigo: string;
  programa_nombre: string;
}

interface ContextoResponse {
  data: {
    incorporaciones: Incorporacion[];
  };
}

@Component({
  selector: "app-cadet-context-page",
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="space-y-6">
      <header class="rounded-2xl bg-white p-6 shadow-sm">
        <p class="text-sm font-semibold uppercase tracking-wider text-[#9b2247]">
          Organización académica
        </p>
        <h1 class="mt-2 text-3xl font-bold text-[#611232]">
          Mi contexto académico
        </h1>
        <p class="mt-3 text-sm text-gray-600">
          Información vinculada a tu Persona institucional.
        </p>
      </header>

      @if (loading()) {
        <p role="status">Consultando información académica...</p>
      } @else if (error()) {
        <p role="alert" class="rounded-xl border border-red-200 p-4">
          {{ error() }}
        </p>
      } @else if (incorporaciones().length === 0) {
        <section class="rounded-xl border bg-white p-6">
          <h2 class="font-semibold">Sin incorporación registrada</h2>
          <p class="mt-2 text-sm text-gray-600">
            No existe una incorporación académica
            asociada a tu Persona institucional.
          </p>
        </section>
      } @else {
        @for (item of incorporaciones(); track item.matricula) {
          <section class="rounded-xl border bg-white p-6">
            <h2 class="text-xl font-bold text-[#611232]">
              {{ item.programa_nombre }}
            </h2>
            <dl class="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-sm text-gray-500">Programa</dt>
                <dd class="font-medium">{{ item.programa_codigo }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Matrícula</dt>
                <dd class="font-medium">{{ item.matricula }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Generación</dt>
                <dd class="font-medium">
                  {{ item.generacion }} — {{ item.anio }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Grupo</dt>
                <dd class="font-medium">{{ item.grupo }}</dd>
              </div>
            </dl>
          </section>
        }

        <section class="rounded-xl border bg-white p-6">
          <h2 class="text-lg font-semibold text-[#611232]">
            Evaluación docente
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Las evaluaciones se mostrarán cuando existan
            asignaciones docentes y campañas elegibles.
          </p>
        </section>
      }

      <a
        routerLink="/inicio"
        class="inline-block rounded-lg border px-4 py-2 text-sm"
      >
        Regresar al inicio
      </a>
    </main>
  `,
})
export class CadetContextPageComponent {
  private readonly http = inject(HttpClient);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly incorporaciones = signal<readonly Incorporacion[]>([]);

  constructor() {
    this.http
      .get<ContextoResponse>("/api/academico/mi-contexto")
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (response) => {
          this.incorporaciones.set(response.data.incorporaciones);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(
            "No se pudo consultar el contexto académico autorizado."
          );
          this.loading.set(false);
        },
      });
  }
}