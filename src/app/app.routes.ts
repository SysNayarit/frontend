import { Routes } from "@angular/router";
import { AccessStatusPageComponent } from "./auth/access-status-page.component";

import { authGuard } from "./auth/auth.guard";
import { LoginPageComponent } from "./auth/login-page.component";
import {
  personasImportGuard,
  personasViewGuard,
  usuariosViewGuard,
} from "./auth/permission.guard";
import { HomeComponent } from "./home.component";

import { AuthenticatedLayoutComponent } from "./shell/presentation/templates/authenticated-layout/authenticated-layout.component";
import { PersonImportPageComponent } from "./personas/presentation/pages/person-import-page/person-import-page.component";
import { PersonasPageComponent } from "./personas/presentation/pages/personas-page/personas-page.component";

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "acceso",
  },
  {
    path: "acceso",
    component: LoginPageComponent,
  },
  {
    path: "estado-acceso",
    component: AccessStatusPageComponent,
  },
  {
    path: "",
    component: AuthenticatedLayoutComponent,
    canActivateChild: [authGuard],
    children: [
      {
        path: "inicio",
        component: HomeComponent,
      },
      {
        path: "usuarios/roles/masivo",
        loadComponent: () =>
          import("./usuarios/presentation/pages/bulk-role-assignment-page/bulk-role-assignment-page.component").then(
            (module) => module.BulkRoleAssignmentPageComponent,
          ),
        canActivate: [usuariosViewGuard],
      },
      {
        path: "usuarios/registro",
        loadComponent: () =>
          import("./usuarios/presentation/pages/user-registration-page/user-registration-page.component").then(
            (module) => module.UserRegistrationPageComponent,
          ),
        canActivate: [usuariosViewGuard],
      },
      {
        path: "usuarios/menu",
        loadComponent: () =>
          import("./usuarios/presentation/pages/users-management-page/users-management-page.component").then(
            (module) => module.UsersManagementPageComponent,
          ),
        canActivate: [usuariosViewGuard],
      },
      {
        path: "usuarios",
        loadComponent: () =>
          import("./usuarios/presentation/pages/users-page/users-page.component").then(
            (module) => module.UsersPageComponent,
          ),
        canActivate: [usuariosViewGuard],
      },
      {
        path: "personas/importaciones",
        component: PersonImportPageComponent,
        canActivate: [personasImportGuard],
      },
      {
        path: "personas",
        component: PersonasPageComponent,
        canActivate: [personasViewGuard],
      },
    ],
  },
  {
    path: "**",
    redirectTo: "acceso",
  },
];
