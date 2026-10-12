import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
} from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        App,
      ],
      providers: [
        provideHttpClient(),
        provideRouter(routes),
      ],
    }).compileComponents();
  });

  it('creates the SIGA application', () => {
    const fixture = TestBed.createComponent(App);

    expect(
      fixture.componentInstance,
    ).toBeTruthy();
  });

  it('presenta la pantalla de inicio de sesion en la ruta login', async () => {
    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();

    const router = TestBed.inject(Router);

    await router.navigateByUrl('/acceso');
    await fixture.whenStable();

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('app-login'),
    ).not.toBeNull();

    expect(
      element.textContent,
    ).toContain(
      'Plataforma Integral',
    );

    expect(
      element.textContent,
    ).toContain(
      'Iniciar sesión',
    );
  });
});
