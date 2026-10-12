import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  Observable,
  of,
  Subject,
  throwError,
} from 'rxjs';

import {
  AuthenticatedUser,
  LoginCredentials,
} from './auth.models';
import { AuthService } from './auth.service';
import { LoginComponent } from './login.component';


class RouterStub {
  navigatedTo: string | null = null;

  navigateByUrl(
    url: string,
  ): Promise<boolean> {
    this.navigatedTo = url;

    return Promise.resolve(true);
  }
}
class AuthServiceStub {
  credentials: LoginCredentials | null = null;

  readonly user: AuthenticatedUser = {
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

  loginResult: Observable<AuthenticatedUser> = of(
    this.user,
  );

  login(
    credentials: LoginCredentials,
  ): Observable<AuthenticatedUser> {
    this.credentials = credentials;

    return this.loginResult;
  }
}

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: AuthServiceStub;
  let router: RouterStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
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
      LoginComponent,
    );

    component = fixture.componentInstance;

    auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    router = TestBed.inject(
      Router,
    ) as unknown as RouterStub;

    fixture.detectChanges();
  });

  it('crea el formulario de acceso con correo y contraseña obligatorios', () => {
    expect(
      component.form.controls.email.value,
    ).toBe('');

    expect(
      component.form.controls.password.value,
    ).toBe('');

    expect(
      component.form.invalid,
    ).toBe(true);
  });

  it('no intenta autenticar un formulario invalido', () => {
    component.submit();

    expect(
      auth.credentials,
    ).toBeNull();
  });

  it('envia las credenciales validas al servicio de autenticacion', () => {
    component.form.setValue({
      email: 'admin@imail.com',
      password: 'frase-de-prueba-segura',
    });

    component.submit();

    expect(
      auth.credentials,
    ).toEqual({
      email: 'admin@imail.com',
      password: 'frase-de-prueba-segura',
    });
  });

  it('muestra el mensaje devuelto por el backend cuando las credenciales son invalidas', () => {
    auth.loginResult = throwError(
      () =>
        new HttpErrorResponse({
          status: 422,
          error: {
            message:
              'Las credenciales proporcionadas no son válidas.',
          },
        }),
    );

    component.form.setValue({
      email: 'admin@imail.com',
      password: 'frase-incorrecta',
    });

    component.submit();

    expect(
      component.errorMessage(),
    ).toBe(
      'Las credenciales proporcionadas no son válidas.',
    );
  });

  it('evita un segundo envio mientras el login sigue en curso', () => {
    const pendingLogin =
      new Subject<AuthenticatedUser>();

    auth.loginResult = pendingLogin;

    component.form.setValue({
      email: 'admin@imail.com',
      password: 'frase-de-prueba-segura',
    });

    component.submit();

    expect(
      component.isSubmitting(),
    ).toBe(true);

    auth.credentials = null;

    component.submit();

    expect(
      auth.credentials,
    ).toBeNull();

    pendingLogin.next(
      auth.user,
    );

    pendingLogin.complete();

    expect(
      component.isSubmitting(),
    ).toBe(false);
  });
  it('informa el tiempo de espera cuando el backend responde 429', () => {
    auth.loginResult = throwError(
      () =>
        new HttpErrorResponse({
          status: 429,
          headers: new HttpHeaders({
            'Retry-After': '42',
          }),
          error: {
            message:
              'Demasiados intentos de inicio de sesión.',
          },
        }),
    );

    component.form.setValue({
      email: 'admin@imail.com',
      password: 'frase-de-prueba-segura',
    });

    component.submit();

    expect(
      component.errorMessage(),
    ).toBe(
      'Demasiados intentos de inicio de sesión. Inténtalo nuevamente en 42 segundos.',
    );
  });
  it('navega a inicio cuando la autenticacion es correcta', () => {
    component.form.setValue({
      email: 'admin@imail.com',
      password: 'frase-de-prueba-segura',
    });

    component.submit();

    expect(
      router.navigatedTo,
    ).toBe('/inicio');
  });
});
