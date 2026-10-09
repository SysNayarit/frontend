import {
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  AuthenticatedUser,
  LoginCredentials,
} from './auth.models';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('initializes CSRF, logs in and obtains the authenticated user', () => {
    const credentials: LoginCredentials = {
      email: 'usuario@siga.test',
      password: 'contraseña-de-prueba',
    };

    const authenticatedUser: AuthenticatedUser = {
      id: 1,
      id_persona: null,
      name: 'Usuario SIGA',
      email: 'usuario@siga.test',
      email_verified_at: null,
      created_at: '2026-10-09T00:00:00.000000Z',
      updated_at: '2026-10-09T00:00:00.000000Z',
      person: null,
    };

    let result: AuthenticatedUser | undefined;

    service.login(credentials).subscribe((user) => {
      result = user;
    });

    const csrfRequest = http.expectOne('/sanctum/csrf-cookie');

    expect(csrfRequest.request.method).toBe('GET');

    csrfRequest.flush(null, {
      status: 204,
      statusText: 'No Content',
    });

    const loginRequest = http.expectOne('/login');

    expect(loginRequest.request.method).toBe('POST');
    expect(loginRequest.request.body).toEqual(credentials);

    loginRequest.flush(null, {
      status: 204,
      statusText: 'No Content',
    });

    const userRequest = http.expectOne('/api/user');

    expect(userRequest.request.method).toBe('GET');

    userRequest.flush(authenticatedUser);

    expect(result).toEqual(authenticatedUser);
  });

  it('logs out through the backend session endpoint', () => {
    service.logout().subscribe();

    const request = http.expectOne('/logout');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    request.flush(null, {
      status: 204,
      statusText: 'No Content',
    });
  });

  it('reauthenticates using only the password', () => {
    service.reauthenticate('contraseña').subscribe();

    const request = http.expectOne('/reauthenticate');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      password: 'contraseña',
    });

    request.flush(null, {
      status: 204,
      statusText: 'No Content',
    });
  });
});
