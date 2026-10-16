import { Routes } from "@angular/router";

import { authGuard } from "./auth/auth.guard";
import { LoginPageComponent } from "./auth/login-page.component";
import { personasViewGuard } from "./auth/permission.guard";
import { HomeComponent } from "./home.component";
import { AuthenticatedLayoutComponent } from "./shell/presentation/templates/authenticated-layout/authenticated-layout.component";
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
    path: "",
    component: AuthenticatedLayoutComponent,
    canActivateChild: [authGuard],
    children: [
      {
        path: "inicio",
        component: HomeComponent,
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
