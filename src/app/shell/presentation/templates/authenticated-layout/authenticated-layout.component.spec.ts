import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { of } from "rxjs";

import { AuthenticatedUser } from "../../../../auth/auth.models";
import { AuthService } from "../../../../auth/auth.service";
import { ProfileService } from "../../../../profiles/profile.service";
import { AuthenticatedLayoutComponent } from "./authenticated-layout.component";

class AuthServiceStub {
  logoutCalls = 0;

  currentUserResult: AuthenticatedUser = {
    id: 1,
    id_persona: "0199b329-7600-7000-8000-000000000001",
    name: "admin",
    email: "admin@imail.com",
    email_verified_at: null,
    created_at: "2026-10-09T00:00:00.000000Z",
    updated_at: "2026-10-09T00:00:00.000000Z",
    person: {
      id_persona: "0199b329-7600-7000-8000-000000000001",
      nombres: "María Elena",
      apellido_paterno: "López",
      apellido_materno: "García",
    },
    permissions: ["personas.ver"],
  };

  currentUser() {
    return of(this.currentUserResult);
  }

  logout() {
    this.logoutCalls += 1;

    return of(void 0);
  }
}

class ProfileServiceStub {
  readonly profile = {
    id: 1,
    name: "Personas",
    code: "PERFIL_PERSONAS",
    is_default: true,
    group: {
      id: 1,
      name: "Operación",
      code: "GRUPO_OPERACION",
      sort_order: 10,
    },
  };

  getProfiles() {
    return of({
      data: [this.profile],
    });
  }

  setDefaultProfile(_profileId: number) {
    return of({
      data: this.profile,
    });
  }
}

describe("AuthenticatedLayoutComponent", () => {
  let fixture: ComponentFixture<AuthenticatedLayoutComponent>;

  let auth: AuthServiceStub;

  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthenticatedLayoutComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useClass: AuthServiceStub,
        },
        {
          provide: ProfileService,
          useClass: ProfileServiceStub,
        },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;

    router = TestBed.inject(Router);
  });

  function createFixture(): ComponentFixture<AuthenticatedLayoutComponent> {
    fixture = TestBed.createComponent(AuthenticatedLayoutComponent);

    fixture.detectChanges();

    return fixture;
  }

  it("muestra la identidad del usuario autenticado", () => {
    const fixture = createFixture();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain("María Elena López García");

    expect(element.textContent).toContain("admin@imail.com");
  });

  it("integra el contexto de perfil en el shell persistente", () => {
    const fixture = createFixture();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector("app-profile-context")).not.toBeNull();

    expect(
      element.querySelector('[data-testid="profile-selector"]'),
    ).not.toBeNull();
  });

  it("muestra la navegacion principal segun permisos", () => {
    const fixture = createFixture();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="home-navigation"]'),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-testid="personas-navigation"]'),
    ).not.toBeNull();
  });

  it("oculta personas cuando falta personas.ver", () => {
    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [],
    };

    const fixture = createFixture();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="home-navigation"]'),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-testid="personas-navigation"]'),
    ).toBeNull();
  });

  it("cierra la sesion limpia el contexto y vuelve al acceso", () => {
    const fixture = createFixture();

    const navigateSpy = vi
      .spyOn(router, "navigateByUrl")
      .mockResolvedValue(true);

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="logout-button"]',
    ) as HTMLButtonElement;

    button.click();

    expect(auth.logoutCalls).toBe(1);

    expect(navigateSpy).toHaveBeenCalledWith("/acceso");

    expect(fixture.componentInstance.user()).toBeNull();
  });
});
