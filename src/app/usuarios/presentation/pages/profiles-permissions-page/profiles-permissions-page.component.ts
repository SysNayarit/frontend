import { HttpClient } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { forkJoin } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { UsersModuleNavigationComponent } from "../../molecules/users-module-navigation/users-module-navigation.component";

interface CatalogItem {
  id: number;
  code: string;
  name?: string;
  sort_order?: number;
}

interface ApiList<T> {
  data: T[];
}

@Component({
  selector: "app-profiles-permissions-page",
  standalone: true,
  imports: [UsersModuleNavigationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="space-y-5">
      <app-users-module-navigation />

      <header class="rounded-xl bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase text-[#9b2247]">
          Usuarios y acceso
        </p>
        <h1 class="mt-2 text-2xl font-bold text-[#611232]">
          Perfiles y permisos
        </h1>
        <p class="mt-2 text-sm text-gray-600">
          Consulta los perfiles y los permisos institucionales.
          Los perfiles organizan la interfaz; los roles y permisos
          determinan la autorización efectiva en Laravel.
        </p>
      </header>

      @if (loading()) {
        <p role="status" class="rounded-lg bg-white p-4">
          Cargando catálogos...
        </p>
      }

      @if (error()) {
        <div role="alert" class="rounded-lg border border-red-200 bg-white p-4">
          <p>{{ error() }}</p>
          <button
            type="button"
            class="siga-focus mt-3 rounded-lg bg-[#611232] px-4 py-2 text-white"
            (click)="reload()"
          >Reintentar</button>
        </div>
      }

      @if (!loading() && !error()) {
        <div class="grid gap-4 lg:grid-cols-2">
          <section class="rounded-xl bg-white p-5">
            <h2 class="font-semibold text-[#611232]">
              Grupos de perfiles
            </h2>
            <p class="mt-1 text-xs text-gray-600">
              {{ groups().length }} grupos
            </p>
            <ul class="mt-3 space-y-2">
              @for (group of groups(); track group.id) {
                <li class="rounded-lg border p-3">
                  <strong>{{ group.name }}</strong>
                  <span class="ml-2 text-xs text-gray-500">
                    {{ group.code }}
                  </span>
                </li>
              } @empty {
                <li class="text-sm text-gray-500">Sin grupos registrados.</li>
              }
            </ul>
          </section>

          <section class="rounded-xl bg-white p-5">
            <h2 class="font-semibold text-[#611232]">
              Catálogo de perfiles
            </h2>
            <p class="mt-1 text-xs text-gray-600">
              {{ profiles().length }} perfiles
            </p>
            <ul class="mt-3 space-y-2">
              @for (profile of profiles(); track profile.id) {
                <li class="rounded-lg border p-3">
                  <strong>{{ profile.name }}</strong>
                  <span class="ml-2 text-xs text-gray-500">
                    {{ profile.code }}
                  </span>
                </li>
              } @empty {
                <li class="text-sm text-gray-500">Sin perfiles registrados.</li>
              }
            </ul>
          </section>

          <section class="rounded-xl bg-white p-5">
            <h2 class="font-semibold text-[#611232]">
              Roles
            </h2>
            <p class="mt-1 text-xs text-gray-600">
              {{ roles().length }} roles
            </p>
            <ul class="mt-3 space-y-2">
              @for (role of roles(); track role.id) {
                <li class="rounded-lg border p-3">
                  <strong>{{ role.name }}</strong>
                  <span class="ml-2 text-xs text-gray-500">
                    {{ role.code }}
                  </span>
                </li>
              } @empty {
                <li class="text-sm text-gray-500">Sin roles registrados.</li>
              }
            </ul>
          </section>

          <section class="rounded-xl bg-white p-5">
            <h2 class="font-semibold text-[#611232]">
              Permisos
            </h2>
            <p class="mt-1 text-xs text-gray-600">
              {{ permissions().length }} permisos
            </p>
            <ul class="mt-3 max-h-96 space-y-2 overflow-auto">
              @for (permission of permissions(); track permission.id) {
                <li class="rounded-lg border p-3 text-sm">
                  {{ permission.code }}
                </li>
              } @empty {
                <li class="text-sm text-gray-500">Sin permisos registrados.</li>
              }
            </ul>
          </section>
        </div>

        <p class="text-xs text-gray-600">
          Consulta de solo lectura. La edición y asignación
          administrativa estarán sujetas a permisos específicos,
          reautenticación y auditoría.
        </p>
      }
    </main>
  `,
})
export class ProfilesPermissionsPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly groups = signal<CatalogItem[]>([]);
  readonly profiles = signal<CatalogItem[]>([]);
  readonly roles = signal<CatalogItem[]>([]);
  readonly permissions = signal<CatalogItem[]>([]);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      groups: this.http.get<ApiList<CatalogItem>>("/api/perfiles/grupos"),
      profiles: this.http.get<ApiList<CatalogItem>>("/api/perfiles"),
      roles: this.http.get<ApiList<CatalogItem>>("/api/roles"),
      permissions: this.http.get<ApiList<CatalogItem>>("/api/permisos"),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.groups.set(result.groups.data);
          this.profiles.set(result.profiles.data);
          this.roles.set(result.roles.data);
          this.permissions.set(result.permissions.data);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          const status = error instanceof HttpErrorResponse
            ? error.status
            : 0;

          this.error.set(
            status === 403
              ? "No tienes permisos suficientes para consultar todos los catálogos."
              : "No fue posible consultar los catálogos institucionales."
          );
        },
      });
  }
}
