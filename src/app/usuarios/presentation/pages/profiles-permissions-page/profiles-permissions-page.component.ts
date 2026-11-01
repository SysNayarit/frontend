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
        <p class="text-xs font-semibold uppercase tracking-wide text-[#9b2247]">
          Administración de acceso
        </p>
        <h1 class="mt-2 text-2xl font-bold text-[#611232]">
          Perfiles y permisos
        </h1>
        <p class="mt-2 max-w-3xl text-sm text-gray-600">
          Selecciona la tarea que deseas realizar. Los perfiles organizan
          la interfaz; los roles y permisos controlan las operaciones
          autorizadas por Laravel.
        </p>
      </header>

      <section aria-label="Seleccionar actividad" class="space-y-3">
        <h2 class="text-lg font-semibold text-[#611232]">
          ¿Qué necesitas hacer?
        </h2>

        <div class="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            data-testid="action-assign-profile"
            (click)="showSection('assign')"
            [attr.aria-pressed]="activeSection() === 'assign'"
            [class.border-[#611232]]="activeSection() === 'assign'"
            [class.bg-[#f7f0f2]]="activeSection() === 'assign'"
            class="siga-focus rounded-xl border-2 border-gray-200 bg-white p-5 text-left shadow-sm hover:border-[#9b2247]"
          >
            <span class="block text-xs font-bold text-[#9b2247]">
              ACTIVIDAD 1
            </span>
            <span class="mt-2 block text-lg font-bold text-[#611232]">
              Asignar perfiles
            </span>
            <span class="mt-2 block text-sm text-gray-600">
              Consultar un usuario, asignarle un perfil o retirar uno secundario.
            </span>
          </button>

          @if (canViewRoles()) {
            <button
              type="button"
              data-testid="action-view-role-permissions"
              (click)="showSection('roles')"
              [attr.aria-pressed]="activeSection() === 'roles'"
              [class.border-[#611232]]="activeSection() === 'roles'"
              [class.bg-[#f7f0f2]]="activeSection() === 'roles'"
              class="siga-focus rounded-xl border-2 border-gray-200 bg-white p-5 text-left shadow-sm hover:border-[#9b2247]"
            >
              <span class="block text-xs font-bold text-[#9b2247]">
                ACTIVIDAD 2
              </span>
              <span class="mt-2 block text-lg font-bold text-[#611232]">
                Consultar autorizaciones
              </span>
              <span class="mt-2 block text-sm text-gray-600">
                Seleccionar un rol y comprobar sus permisos ALLOW o DENY.
              </span>
            </button>
          }

          <button
            type="button"
            data-testid="action-view-catalogs"
            (click)="showSection('catalogs')"
            [attr.aria-pressed]="activeSection() === 'catalogs'"
            [class.border-[#611232]]="activeSection() === 'catalogs'"
            [class.bg-[#f7f0f2]]="activeSection() === 'catalogs'"
            class="siga-focus rounded-xl border-2 border-gray-200 bg-white p-5 text-left shadow-sm hover:border-[#9b2247]"
          >
            <span class="block text-xs font-bold text-[#9b2247]">
              ACTIVIDAD {{ canViewRoles() ? '3' : '2' }}
            </span>
            <span class="mt-2 block text-lg font-bold text-[#611232]">
              Consultar catálogos
            </span>
            <span class="mt-2 block text-sm text-gray-600">
              Conocer los perfiles, grupos y otros elementos disponibles.
            </span>
          </button>
        </div>
      </section>

      @if (activeSection() === 'assign') {
        <section class="space-y-3"
          data-testid="workspace-assign-profile">
          <div class="rounded-xl border border-[#e7e2e3] bg-white p-5">
            <h2 class="text-lg font-semibold text-[#611232]">
              Asignar un perfil a un usuario
            </h2>
            <p class="mt-2 text-sm text-gray-700">
              Paso 1: escribe el identificador del usuario y consulta
              sus perfiles. Paso 2: selecciona un perfil disponible.
              Paso 3: confirma la operación con tu contraseña.
            </p>
            <p class="mt-2 text-xs text-gray-600">
              Para asignar o retirar perfiles necesitas el permiso
              usuarios.asignar_perfiles. Un perfil nunca concede
              permisos de acceso.
            </p>
          </div>

          @if (canViewUserProfiles()) {
            <app-user-profile-administration />
          } @else {
            <div class="rounded-xl border bg-white p-5"
              role="status">
              No tienes autorización para consultar los perfiles
              asignados a otros usuarios.
            </div>
          }
        </section>
      }

      @if (activeSection() === 'roles' && canViewRoles()) {
        <section class="space-y-3"
          data-testid="workspace-role-permissions">
          <div class="rounded-xl border border-[#e7e2e3] bg-white p-5">
            <h2 class="text-lg font-semibold text-[#611232]">
              Consultar permisos de un rol
            </h2>
            <p class="mt-2 text-sm text-gray-700">
              Selecciona un rol para conocer las reglas que tiene
              registradas. ALLOW permite y DENY deniega;
              Laravel resuelve el acceso efectivo del usuario.
            </p>
            <p class="mt-2 text-xs text-gray-600">
              Esta herramienta es de consulta. Todavía no permite
              agregar, editar ni retirar permisos de un rol.
            </p>
          </div>

          @if (loading().roles) {
            <p role="status" class="rounded-xl bg-white p-4">
              Cargando roles...
            </p>
          } @else if (errors().roles) {
            <div class="rounded-xl bg-white p-4">
              <p role="alert">{{ errors().roles }}</p>
              <button type="button" (click)="load('roles')"
                class="siga-focus mt-3 rounded-lg border px-4 py-2">
                Reintentar
              </button>
            </div>
          } @else {
            <app-role-permissions-inspector [roles]="roles()" />
          }
        </section>
      }

      @if (activeSection() === 'catalogs') {
        <section class="space-y-3"
          data-testid="workspace-catalogs">
          <div class="rounded-xl border border-[#e7e2e3] bg-white p-5">
            <h2 class="text-lg font-semibold text-[#611232]">
              Catálogos institucionales
            </h2>
            <p class="mt-2 text-sm text-gray-600">
              Aquí puedes consultar los elementos registrados.
              Estos catálogos todavía son de solo lectura.
            </p>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <section class="rounded-xl bg-white p-5"
              aria-label="Grupos de perfiles">
              <h3 class="font-semibold text-[#611232]">
                Grupos de perfiles
              </h3>
              @if (loading().groups) {
                <p role="status" class="mt-3 text-sm">
                  Cargando grupos...
                </p>
              } @else if (errors().groups) {
                <p role="alert" class="mt-3 text-sm text-red-700">
                  {{ errors().groups }}
                </p>
                <button type="button" (click)="load('groups')"
                  class="siga-focus mt-3 rounded-lg border px-3 py-2">
                  Reintentar
                </button>
              } @else {
                <ul class="mt-3 space-y-2">
                  @for (item of groups(); track item.id) {
                    <li class="rounded-lg border p-3">
                      <strong>{{ item.name }}</strong>
                      <span class="ml-2 text-xs text-gray-500">
                        {{ item.code }}
                      </span>
                    </li>
                  } @empty {
                    <li class="text-sm text-gray-500">
                      No hay grupos registrados.
                    </li>
                  }
                </ul>
              }
            </section>

            <section class="rounded-xl bg-white p-5"
              aria-label="Catálogo de perfiles">
              <h3 class="font-semibold text-[#611232]">
                Perfiles disponibles
              </h3>
              @if (loading().profiles) {
                <p role="status" class="mt-3 text-sm">
                  Cargando perfiles...
                </p>
              } @else if (errors().profiles) {
                <p role="alert" class="mt-3 text-sm text-red-700">
                  {{ errors().profiles }}
                </p>
                <button type="button" (click)="load('profiles')"
                  class="siga-focus mt-3 rounded-lg border px-3 py-2">
                  Reintentar
                </button>
              } @else {
                <ul class="mt-3 space-y-2">
                  @for (item of profiles(); track item.id) {
                    <li class="rounded-lg border p-3">
                      <strong>{{ item.name }}</strong>
                      <span class="ml-2 text-xs text-gray-500">
                        {{ item.code }}
                      </span>
                    </li>
                  } @empty {
                    <li class="text-sm text-gray-500">
                      No hay perfiles registrados.
                    </li>
                  }
                </ul>
              }
            </section>

            @if (canViewRoles()) {
              <section class="rounded-xl bg-white p-5"
                aria-label="Catálogo de roles">
                <h3 class="font-semibold text-[#611232]">
                  Roles institucionales
                </h3>
                @if (loading().roles) {
                  <p role="status" class="mt-3 text-sm">
                    Cargando roles...
                  </p>
                } @else if (errors().roles) {
                  <p role="alert" class="mt-3 text-sm text-red-700">
                    {{ errors().roles }}
                  </p>
                  <button type="button" (click)="load('roles')"
                    class="siga-focus mt-3 rounded-lg border px-3 py-2">
                    Reintentar
                  </button>
                } @else {
                  <ul class="mt-3 space-y-2">
                    @for (item of roles(); track item.id) {
                      <li class="rounded-lg border p-3">
                        <strong>{{ item.name }}</strong>
                        <span class="ml-2 text-xs text-gray-500">
                          {{ item.code }}
                        </span>
                      </li>
                    } @empty {
                      <li class="text-sm text-gray-500">
                        No hay roles registrados.
                      </li>
                    }
                  </ul>
                }
              </section>

              <section class="rounded-xl bg-white p-5"
                aria-label="Catálogo de permisos">
                <h3 class="font-semibold text-[#611232]">
                  Permisos registrados
                </h3>
                @if (loading().permissions) {
                  <p role="status" class="mt-3 text-sm">
                    Cargando permisos...
                  </p>
                } @else if (errors().permissions) {
                  <p role="alert" class="mt-3 text-sm text-red-700">
                    {{ errors().permissions }}
                  </p>
                  <button type="button" (click)="load('permissions')"
                    class="siga-focus mt-3 rounded-lg border px-3 py-2">
                    Reintentar
                  </button>
                } @else {
                  <ul class="mt-3 max-h-96 space-y-2 overflow-auto">
                    @for (item of permissions(); track item.id) {
                      <li class="rounded-lg border p-3 text-sm">
                        {{ item.code }}
                      </li>
                    } @empty {
                      <li class="text-sm text-gray-500">
                        No hay permisos registrados.
                      </li>
                    }
                  </ul>
                }
              </section>
            }
          </div>
        </section>
      }
    </main>
  `,
})
export class ProfilesPermissionsPageComponent implements OnInit {
  readonly activeSection = signal<"assign" | "roles" | "catalogs">("assign");

  showSection(section: "assign" | "roles" | "catalogs"): void {
    if (section === "roles" && !this.canViewRoles()) return;
    this.activeSection.set(section);
  }
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
