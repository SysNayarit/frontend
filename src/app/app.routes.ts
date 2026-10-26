import { Routes } from "@angular/router";
import { AccessStatusPageComponent } from "./auth/access-status-page.component";

import { authGuard } from "./auth/auth.guard";
import { LoginPageComponent } from "./auth/login-page.component";
import {
  personasImportGuard,
  personasViewGuard,
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
