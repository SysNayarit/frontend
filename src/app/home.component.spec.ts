import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from './auth/auth.service';
import { HomeComponent } from './home.component';

class AuthServiceStub {
  logoutCalls = 0;

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
  let fixture: ComponentFixture<HomeComponent>;
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

    fixture = TestBed.createComponent(
      HomeComponent,
    );

    auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    router = TestBed.inject(
      Router,
    ) as unknown as RouterStub;

    fixture.detectChanges();
  });

  it('muestra la accion para cerrar sesion', () => {
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

  it('cierra la sesion y regresa al login', () => {
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
});
