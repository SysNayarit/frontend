import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import {
  AuthenticatedUser,
} from './auth/auth.models';
import { AuthService } from './auth/auth.service';
import { HomeComponent } from './home.component';

class AuthServiceStub {
  logoutCalls = 0;

  currentUserResult: AuthenticatedUser = {
    id: 1,
    id_persona: null,
    name: 'admin',
    email: 'admin@imail.com',
    email_verified_at: null,
    created_at: '2026-10-09T00:00:00.000000Z',
    updated_at: '2026-10-09T00:00:00.000000Z',
    person: null,
    permissions: [],
  };

  currentUser() {
    return of(
      this.currentUserResult,
    );
  }

  logout() {
    this.logoutCalls += 1;

    return of(void 0);
  }
}

class RouterStub {
  navigatedTo: string | null = null;

  navigateByUrl(
    url: string,
  ): Promise<boolean> {
    this.navigatedTo = url;

    return Promise.resolve(true);
  }
}

describe('HomeComponent', () => {
  let auth: AuthServiceStub;
  let router: RouterStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HomeComponent,
      ],
      providers: [
        {
          provide: AuthService,
          useClass: AuthServiceStub,
        },
        {
          provide: Router,
          useClass: RouterStub,
        },
      ],
    }).compileComponents();

    auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    router = TestBed.inject(
      Router,
    ) as unknown as RouterStub;
  });

  function createFixture(): ComponentFixture<HomeComponent> {
    const fixture = TestBed.createComponent(
      HomeComponent,
    );

    fixture.detectChanges();

    return fixture;
  }

  it('muestra la informacion del usuario autenticado', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.textContent,
    ).toContain('admin');

    expect(
      element.textContent,
    ).toContain('admin@imail.com');
  });

  it('muestra el nombre de la persona asociada cuando existe', () => {
    auth.currentUserResult = {
      ...auth.currentUserResult,
      id_persona:
        '0199b329-7600-7000-8000-000000000001',
      person: {
        id_persona:
          '0199b329-7600-7000-8000-000000000001',
        nombres: 'María Elena',
        apellido_paterno: 'López',
        apellido_materno: 'García',
      },
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.textContent,
    ).toContain(
      'María Elena López García',
    );
  });

  it('muestra la accion para cerrar sesion', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const button = element.querySelector(
      '[data-testid="logout-button"]',
    );

    expect(button).not.toBeNull();

    expect(
      button?.textContent,
    ).toContain(
      'Cerrar sesión',
    );
  });

  it('cierra la sesion y regresa al acceso', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const button = element.querySelector(
      '[data-testid="logout-button"]',
    ) as HTMLButtonElement;

    button.click();

    expect(
      auth.logoutCalls,
    ).toBe(1);

    expect(
      router.navigatedTo,
    ).toBe('/acceso');
  });

  it('muestra el modulo personas cuando el usuario tiene permiso para consultarlo', () => {
    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
      ],
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const personasNavigation = element.querySelector(
      '[data-testid="personas-navigation"]',
    );

    expect(personasNavigation).not.toBeNull();

    expect(
      personasNavigation?.textContent,
    ).toContain('Personas');
  });

  it('oculta el modulo personas cuando el usuario no tiene permiso para consultarlo', () => {
    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [],
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const personasNavigation = element.querySelector(
      '[data-testid="personas-navigation"]',
    );

    expect(personasNavigation).toBeNull();
  });

  it('navega al modulo personas cuando se selecciona la opcion autorizada', () => {
    auth.currentUserResult = {
      ...auth.currentUserResult,
      permissions: [
        'personas.ver',
      ],
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const personasNavigation = element.querySelector(
      '[data-testid="personas-navigation"]',
    ) as HTMLElement;

    expect(personasNavigation).not.toBeNull();

    personasNavigation.click();

    expect(
      router.navigatedTo,
    ).toBe('/personas');
  });
});
