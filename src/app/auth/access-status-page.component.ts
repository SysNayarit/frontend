import { Component, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";

@Component({
  selector: "app-access-status-page",
  imports: [RouterLink],
  template: `
    <main class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section class="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        @if (isPermissionError) {
          <h1 class="text-xl font-semibold text-slate-900">
            Acceso no autorizado
          </h1>
          <p class="mt-3 text-sm leading-6 text-slate-700">
            No cuenta con autorización para realizar esta consulta.
            Su sesión no se ha cerrado.
          </p>
        } @else {
          <h1 class="text-xl font-semibold text-slate-900">
            No fue posible verificar el acceso
          </h1>
          <p class="mt-3 text-sm leading-6 text-slate-700">
            Existe un problema temporal de comunicación o disponibilidad.
            Esto no significa necesariamente que su sesión haya vencido.
          </p>
        }

        <div class="mt-6 flex flex-wrap gap-3">
          <a
            routerLink="/inicio"
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Volver a intentar
          </a>
          <a
            routerLink="/acceso"
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
          >
            Ir al acceso
          </a>
        </div>
      </section>
    </main>
  `,
})
export class AccessStatusPageComponent {
  private readonly route = inject(ActivatedRoute);

  get isPermissionError(): boolean {
    return this.route.snapshot.queryParamMap.get("tipo") === "permisos";
  }
}