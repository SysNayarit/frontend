import { Routes } from "@angular/router";
import { academicTrainersViewGuard } from "./auth/permission.guard";
import { AccessStatusPageComponent } from "./auth/access-status-page.component";

import { authGuard } from "./auth/auth.guard";
import { LoginPageComponent } from "./auth/login-page.component";
import {
  personasImportGuard,
  personasViewGuard,
  perfilesViewGuard,
  usuariosViewGuard,
} from "./auth/permission.guard";
import { academicOrganizationViewGuard } from "./auth/permission.guard";
import { credentialQrValidateGuard } from "./auth/permission.guard";
import { credentialManagementGuard } from "./auth/permission.guard";
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
        path: "eventos/gestion",
        loadComponent: () =>
          import("./eventos/presentation/pages/event-management-page.component")
            .then(m => m.EventManagementPageComponent),
        canActivate: [authGuard],
      },
      {
        path: "eventos/:evento/inscripciones",
        loadComponent: () =>
          import("./eventos/presentation/pages/event-registrations-page.component")
            .then(m => m.EventRegistrationsPageComponent),
        canActivate: [authGuard],
      },
      {
        path: "credenciales/institucionales/emitir",
        loadComponent: () =>
          import("./credenciales/presentation/pages/institutional-credential-issue-page.component")
            .then(m => m.InstitutionalCredentialIssuePageComponent),
        canActivate: [credentialManagementGuard],
      },
      { path: "credenciales/qr/generar", loadComponent: () => import("./credenciales/presentation/pages/credential-qr-generator-page.component").then(m => m.CredentialQrGeneratorPageComponent), canActivate: [credentialManagementGuard] },
      {
        path: "credenciales/qr/validar",
        loadComponent: () =>
          import("./credenciales/presentation/pages/credential-qr-validator-page.component").then(
            (module) => module.CredentialQrValidatorPageComponent,
          ),
        canActivate: [credentialQrValidateGuard],
      },
      {
        path: "academico/evaluacion-docente/preparacion",
        loadComponent: () =>
          import("./academico/presentation/pages/academic-teacher-evaluation-readiness-page.component").then(
            (module) => module.AcademicTeacherEvaluationReadinessPageComponent,
          ),
        canActivate: [
          academicOrganizationViewGuard,
          academicTrainersViewGuard,
        ],
      },
      {
        path: "academico/evaluacion-docente",
        redirectTo: "academico/mi-contexto",
      },
      {
        path: "academico/formadores/consulta",
        loadComponent: () =>
          import("./academico/presentation/pages/academic-formadores-consulta-page.component").then(
            (module) => module.AcademicFormadoresConsultaPageComponent,
          ),
        canActivate: [academicTrainersViewGuard],
      },
      {
        path: "academico/formadores",
        loadComponent: () =>
          import("./academico/presentation/pages/academic-trainers-page.component").then(
            (module) => module.AcademicTrainersPageComponent,
          ),
        canActivate: [academicTrainersViewGuard],
      },
      {
        path: "academico/mi-contexto",
        loadComponent: () =>
          import("./academico/presentation/pages/cadet-context-evaluation-page.component").then(
            (module) => module.CadetContextEvaluationPageComponent,
          ),
      },
      {
        path: "academico/importaciones/materias",
        loadComponent: () =>
          import("./academico/presentation/pages/academic-bulk-catalog-preview-page.component").then(
            (module) => module.AcademicBulkCatalogPreviewPageComponent,
          ),
        canActivate: [academicOrganizationViewGuard],
        data: { catalogo: "materias" },
      },
      {
        path: "academico/importaciones/formadores",
        loadComponent: () =>
          import("./academico/presentation/pages/academic-bulk-catalog-preview-page.component").then(
            (module) => module.AcademicBulkCatalogPreviewPageComponent,
          ),
        canActivate: [academicTrainersViewGuard],
        data: { catalogo: "formadores" },
      },
      {
        path: "academico/organizacion/horarios",
        loadComponent: () =>
          import("./academico/presentation/pages/academic-class-schedule-page.component").then(
            (module) => module.AcademicClassSchedulePageComponent,
          ),
        canActivate: [academicOrganizationViewGuard],
      },
      {
        path: "academico/organizacion",
        loadComponent: () =>
          import("./academico/presentation/pages/academic-organization-page.component").then(
            (module) => module.AcademicOrganizationPageComponent,
          ),
        canActivate: [academicOrganizationViewGuard],
      },
      {
        path: "inicio",
        component: HomeComponent,
      },
      {
        path: "usuarios/perfiles-permisos",
        loadComponent: () =>
          import("./usuarios/presentation/pages/profiles-permissions-page/profiles-permissions-page.component").then(
            (module) => module.ProfilesPermissionsPageComponent,
          ),
        canActivate: [perfilesViewGuard],
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
