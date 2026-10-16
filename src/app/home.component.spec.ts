import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";

import { AuthenticatedUser } from "./auth/auth.models";
import { AuthService } from "./auth/auth.service";
import { HomeComponent } from "./home.component";

class AuthServiceStub {
  currentUserResult: AuthenticatedUser = {
    id: 1,
    id_persona: null,
    name: "admin",
    email: "admin@imail.com",
    email_verified_at: null,
    created_at: "2026-10-09T00:00:00.000000Z",
    updated_at: "2026-10-09T00:00:00.000000Z",
    person: null,
    permissions: [],
  };

  currentUser() {
    return of(this.currentUserResult);
  }
}

describe("HomeComponent", () => {
  let auth: AuthServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        {
          provide: AuthService,
          useClass: AuthServiceStub,
        },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;
  });

  function createFixture(): ComponentFixture<HomeComponent> {
    const fixture = TestBed.createComponent(HomeComponent);

    fixture.detectChanges();

    return fixture;
  }

  it("muestra el contenido propio de inicio", () => {
    const fixture = createFixture();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain("Bienvenido a SIGA");

    expect(element.textContent).toContain("admin");

    expect(element.textContent).toContain("admin@imail.com");
  });

  it("muestra el nombre de la persona asociada", () => {
    auth.currentUserResult = {
      ...auth.currentUserResult,
      id_persona: "0199b329-7600-7000-8000-000000000001",
      person: {
        id_persona: "0199b329-7600-7000-8000-000000000001",
        nombres: "María Elena",
        apellido_paterno: "López",
        apellido_materno: "García",
      },
    };

    const fixture = createFixture();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      "María Elena López García",
    );
  });

  it("no vuelve a renderizar responsabilidades del shell", () => {
    const fixture = createFixture();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="logout-button"]')).toBeNull();

    expect(
      element.querySelector('[data-testid="personas-navigation"]'),
    ).toBeNull();

    expect(
      element.querySelector('img[src="/branding/sesnsp-2026-banner.jpg"]'),
    ).toBeNull();
  });
});
