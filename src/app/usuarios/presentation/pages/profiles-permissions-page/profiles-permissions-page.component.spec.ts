import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";

import { AuthContextService } from "../../../../auth/auth-context.service";
import { ProfilesPermissionsPageComponent } from "./profiles-permissions-page.component";

describe("Perfiles y permisos por autorización", () => {
  let http: HttpTestingController;
  let permissions: Set<string>;
  let page: ProfilesPermissionsPageComponent;

  beforeEach(async () => {
    permissions = new Set(["perfiles.ver"]);

    await TestBed.configureTestingModule({
      imports: [
        ProfilesPermissionsPageComponent,
        RouterTestingModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthContextService,
          useValue: {
            hasPermission: (code: string) => permissions.has(code),
          },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function create(): void {
    const fixture = TestBed.createComponent(ProfilesPermissionsPageComponent);
    page = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("consulta perfiles sin solicitar roles no autorizados", () => {
    create();

    http.expectOne("/api/perfiles/grupos").flush({
      data: [{ id: 1, code: "GENERAL", name: "General" }],
    });
    http.expectOne("/api/perfiles").flush({
      data: [{ id: 2, code: "CONSULTA", name: "Consulta" }],
    });

    http.expectNone("/api/roles");
    http.expectNone("/api/permisos");

    expect(page.groups()).toHaveLength(1);
    expect(page.profiles()).toHaveLength(1);
    expect(page.canViewRoles()).toBe(false);
  });

  it("mantiene perfiles si Laravel deniega grupos", () => {
    create();

    http.expectOne("/api/perfiles/grupos").flush(
      { message: "Forbidden" },
      { status: 403, statusText: "Forbidden" },
    );
    http.expectOne("/api/perfiles").flush({
      data: [{ id: 3, code: "OPERATIVO", name: "Operativo" }],
    });

    expect(page.errors().groups).toContain("denegó");
    expect(page.errors().profiles).toBeNull();
    expect(page.profiles()).toHaveLength(1);
  });

  it("consulta cuatro catálogos si tiene ambos permisos", () => {
    permissions.add("roles.ver");
    create();

    http.expectOne("/api/perfiles/grupos").flush({ data: [] });
    http.expectOne("/api/perfiles").flush({ data: [] });
    http.expectOne("/api/roles").flush({
      data: [{ id: 1, code: "ADMIN", name: "Administración" }],
    });
    http.expectOne("/api/permisos").flush({
      data: [{ id: 5, code: "usuarios.ver" }],
    });

    expect(page.roles()).toHaveLength(1);
    expect(page.permissions()).toHaveLength(1);
  });

  it("un fallo de roles no oculta perfiles ni permisos", () => {
    permissions.add("roles.ver");
    create();

    http.expectOne("/api/perfiles/grupos").flush({ data: [] });
    http.expectOne("/api/perfiles").flush({
      data: [{ id: 2, code: "CONSULTA" }],
    });
    http.expectOne("/api/roles").flush(
      { message: "Forbidden" },
      { status: 403, statusText: "Forbidden" },
    );
    http.expectOne("/api/permisos").flush({
      data: [{ id: 5, code: "usuarios.ver" }],
    });

    expect(page.errors().roles).toContain("denegó");
    expect(page.profiles()).toHaveLength(1);
    expect(page.permissions()).toHaveLength(1);
  });

  it("reintenta únicamente el catálogo solicitado", () => {
    create();

    http.expectOne("/api/perfiles/grupos").flush({ data: [] });
    http.expectOne("/api/perfiles").flush(
      { message: "Error" },
      { status: 500, statusText: "Server Error" },
    );

    page.load("profiles");

    http.expectOne("/api/perfiles").flush({
      data: [{ id: 8, code: "GESTION" }],
    });

    http.expectNone("/api/roles");
    expect(page.errors().profiles).toBeNull();
    expect(page.profiles()).toHaveLength(1);
  });
});
