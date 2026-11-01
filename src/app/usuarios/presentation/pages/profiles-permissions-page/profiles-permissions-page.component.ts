import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { AuthContextService } from "../../../../auth/auth-context.service";
import { RolePermissionsInspectorComponent } from "../../organisms/role-permissions-inspector/role-permissions-inspector.component";
import { UserProfileAdministrationComponent } from "../../organisms/user-profile-administration/user-profile-administration.component";
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

type Catalog = "groups" | "profiles" | "roles" | "permissions";

@Component({
  selector: "app-profiles-permissions-page",
  standalone: true,
  imports: [
    UsersModuleNavigationComponent,
    UserProfileAdministrationComponent,
    RolePermissionsInspectorComponent,
  ],
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
          Los perfiles organizan la experiencia visual.
          Los roles y permisos determinan la autorización efectiva
          exclusivamente en Laravel.
        </p>
      </header>

      <div class="grid gap-5 lg:grid-cols-2">
        <section class="rounded-xl bg-white p-5"
          aria-label="Grupos de perfiles">
          <h2 class="font-semibold text-[#611232]">Grupos de perfiles</h2>
          @if (loading().groups) {
            <p role="status" class="mt-3 text-sm">Cargando grupos...</p>
          } @else if (errors().groups) {
            <p role="alert" class="mt-3 text-sm text-red-700">
              {{ errors().groups }}
            </p>
            <button type="button" (click)="load('groups')"
              class="siga-focus mt-3 rounded-lg border px-3 py-2 text-sm">
              Reintentar grupos
            </button>
          } @else {
            <p class="mt-2 text-xs text-gray-500">
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
          }
        </section>

        <section class="rounded-xl bg-white p-5"
          aria-label="Catálogo de perfiles">
          <h2 class="font-semibold text-[#611232]">
            Catálogo de perfiles
          </h2>
          @if (loading().profiles) {
            <p role="status" class="mt-3 text-sm">Cargando perfiles...</p>
          } @else if (errors().profiles) {
            <p role="alert" class="mt-3 text-sm text-red-700">
              {{ errors().profiles }}
            </p>
            <button type="button" (click)="load('profiles')"
              class="siga-focus mt-3 rounded-lg border px-3 py-2 text-sm">
              Reintentar perfiles
            </button>
          } @else {
            <p class="mt-2 text-xs text-gray-500">
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
          }
        </section>

        @if (canViewRoles()) {
          <section class="rounded-xl bg-white p-5"
            aria-label="Catálogo de roles">
            <h2 class="font-semibold text-[#611232]">Roles</h2>
            @if (loading().roles) {
              <p role="status" class="mt-3 text-sm">Cargando roles...</p>
            } @else if (errors().roles) {
              <p role="alert" class="mt-3 text-sm text-red-700">
                {{ errors().roles }}
              </p>
              <button type="button" (click)="load('roles')"
                class="siga-focus mt-3 rounded-lg border px-3 py-2 text-sm">
                Reintentar roles
              </button>
            } @else {
              <p class="mt-2 text-xs text-gray-500">
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
                  <li class="text-sm text-gray-500">
                    Sin roles registrados.
                  </li>
                }
              </ul>
            }
          </section>

          <section class="rounded-xl bg-white p-5"
            aria-label="Catálogo de permisos">
            <h2 class="font-semibold text-[#611232]">Permisos</h2>
            @if (loading().permissions) {
              <p role="status" class="mt-3 text-sm">
                Cargando permisos...
              </p>
            } @else if (errors().permissions) {
              <p role="alert" class="mt-3 text-sm text-red-700">
                {{ errors().permissions }}
              </p>
              <button type="button" (click)="load('permissions')"
                class="siga-focus mt-3 rounded-lg border px-3 py-2 text-sm">
                Reintentar permisos
              </button>
            } @else {
              <p class="mt-2 text-xs text-gray-500">
                {{ permissions().length }} permisos
              </p>
              <ul class="mt-3 max-h-96 space-y-2 overflow-auto">
                @for (permission of permissions(); track permission.id) {
                  <li class="rounded-lg border p-3 text-sm">
                    {{ permission.code }}
                  </li>
                } @empty {
                  <li class="text-sm text-gray-500">
                    Sin permisos registrados.
                  </li>
                }
              </ul>
            }
          </section>
        }
      </div>

      @if (canViewRoles() && !errors().roles && !loading().roles) {
        <app-role-permissions-inspector [roles]="roles()" />
      }

      @if (canViewUserProfiles()) {
        <app-user-profile-administration />
      }

      <p class="text-xs text-gray-600">
        La consulta de catálogos es independiente por sección.
        Las operaciones administrativas requieren autorización,
        confirmación y reautenticación. El perfil no concede permisos.
      </p>
    </main>
  `,
})
export class ProfilesPermissionsPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthContextService);

  readonly groups = signal<CatalogItem[]>([]);
  readonly profiles = signal<CatalogItem[]>([]);
  readonly roles = signal<CatalogItem[]>([]);
  readonly permissions = signal<CatalogItem[]>([]);

  readonly loading = signal<Record<Catalog, boolean>>({
    groups: false,
    profiles: false,
    roles: false,
    permissions: false,
  });

  readonly errors = signal<Record<Catalog, string | null>>({
    groups: null,
    profiles: null,
    roles: null,
    permissions: null,
  });

  private readonly paths: Record<Catalog, string> = {
    groups: "/api/perfiles/grupos",
    profiles: "/api/perfiles",
    roles: "/api/roles",
    permissions: "/api/permisos",
  };

  private readonly versions: Record<Catalog, number> = {
    groups: 0,
    profiles: 0,
    roles: 0,
    permissions: 0,
  };

  canViewRoles(): boolean {
    return this.auth.hasPermission("roles.ver");
  }

  canViewUserProfiles(): boolean {
    return this.auth.hasPermission("usuarios.ver") &&
      this.auth.hasPermission("perfiles.ver");
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.load("groups");
    this.load("profiles");

    if (this.canViewRoles()) {
      this.load("roles");
      this.load("permissions");
    } else {
      for (const section of ["roles", "permissions"] as const) {
        ++this.versions[section];
        this.setData(section, []);
        this.loading.update(old => ({ ...old, [section]: false }));
        this.errors.update(old => ({ ...old, [section]: null }));
      }
    }
  }

  load(section: Catalog): void {
    if (
      !this.auth.hasPermission("perfiles.ver") ||
      ((section === "roles" || section === "permissions") &&
        !this.canViewRoles())
    ) return;

    const version = ++this.versions[section];
    this.setData(section, []);
    this.errors.update(old => ({ ...old, [section]: null }));
    this.loading.update(old => ({ ...old, [section]: true }));

    this.http.get<ApiList<CatalogItem>>(this.paths[section])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          if (version !== this.versions[section]) return;
          this.setData(section, result.data);
          this.loading.update(old => ({
            ...old,
            [section]: false,
          }));
        },
        error: (error: unknown) => {
          if (version !== this.versions[section]) return;
          const status = error instanceof HttpErrorResponse
            ? error.status : 0;
          this.errors.update(old => ({
            ...old,
            [section]: status === 403
              ? "Laravel denegó la consulta de esta sección."
              : "No fue posible consultar este catálogo.",
          }));
          this.loading.update(old => ({
            ...old,
            [section]: false,
          }));
        },
      });
  }

  private setData(section: Catalog, data: CatalogItem[]): void {
    switch (section) {
      case "groups": this.groups.set(data); break;
      case "profiles": this.profiles.set(data); break;
      case "roles": this.roles.set(data); break;
      case "permissions": this.permissions.set(data); break;
    }
  }
}
