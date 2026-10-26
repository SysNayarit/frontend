import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import {
  firstValueFrom,
  Observable,
  of,
  throwError,
} from 'rxjs';

import { AuthenticatedUser } from './auth.models';
import { AuthService } from './auth.service';
import {
  personasImportGuard,
  personasViewGuard,
} from './permission.guard';

class AuthServiceStub {
  currentUserResult: Observable<AuthenticatedUser> = of({
    id: 1,
    id_persona: null,
    name: 'admin',
    email: 'admin@imail.com',
    email_verified_at: null,
    created_at: '2026-10-09T00:00:00.000000Z',
    updated_at: '2026-10-09T00:00:00.000000Z',
    person: null,
    permissions: [
      'personas.ver',
    ],
  });

  currentUser(): Observable<AuthenticatedUser> {
    return this.currentUserResult;
  }
}

describe('personasViewGuard', () => {
  let auth: AuthServiceStub;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useClass: AuthServiceStub,
        },
      ],
    });

    auth = TestBed.inject(
      AuthService,
    ) as unknown as AuthServiceStub;

    router = TestBed.inject(Router);
  });

  async function runGuard(
    guard = personasViewGuard,
  ): Promise<boolean | UrlTree> {
    const result = TestBed.runInInjectionContext(
      () =>
        guard(
          {} as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ),
    );

    return firstValueFrom(
      result as Observable<boolean | UrlTree>,
    );
  }

  it('permite acceder cuando el usuario tiene personas.ver', async () => {
    const result = await runGuard();

    expect(result).toBe(true);
  });

  it('redirige a inicio cuando el usuario no tiene personas.ver', async () => {
    auth.currentUserResult = of({
      id: 1,
      id_persona: null,
      name: 'admin',
      email: 'admin@imail.com',
      email_verified_at: null,
      created_at: '2026-10-09T00:00:00.000000Z',
      updated_at: '2026-10-09T00:00:00.000000Z',
      person: null,
      permissions: [],
    });

    const result = await runGuard();

    expect(result instanceof UrlTree).toBe(true);

    expect(
      router.serializeUrl(
        result as UrlTree,
      ),
    ).toBe('/inicio');
  });

  it('redirige al acceso cuando la sesion ya no es valida', async () => {
    auth.currentUserResult = throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
        }),
    );

    const result = await runGuard();

    expect(result instanceof UrlTree).toBe(true);

    expect(
      router.serializeUrl(
        result as UrlTree,
      ),
    ).toBe('/acceso');
  });
  it('permite importar cuando el usuario tiene personas.importar', async () => {
    auth.currentUserResult = of({
      id: 1,
      id_persona: null,
      name: 'admin',
      email: 'admin@imail.com',
      email_verified_at: null,
      created_at: '2026-10-09T00:00:00.000000Z',
      updated_at: '2026-10-09T00:00:00.000000Z',
      person: null,
      permissions: [
        'personas.importar',
      ],
    });

    expect(
      await runGuard(
        personasImportGuard,
      ),
    ).toBe(true);
  });

  it('rechaza importaciones cuando falta personas.importar', async () => {
    auth.currentUserResult = of({
      id: 1,
      id_persona: null,
      name: 'admin',
      email: 'admin@imail.com',
      email_verified_at: null,
      created_at: '2026-10-09T00:00:00.000000Z',
      updated_at: '2026-10-09T00:00:00.000000Z',
      person: null,
      permissions: [
        'personas.ver',
      ],
    });

    const result =
      await runGuard(
        personasImportGuard,
      );

    expect(
      result instanceof UrlTree,
    ).toBe(true);

    expect(
      router.serializeUrl(
        result as UrlTree,
      ),
    ).toBe('/inicio');
  });

  it("distingue HTTP 403 de una sesion vencida", async () => {
    auth.currentUserResult = throwError(
      () => new HttpErrorResponse({ status: 403 }),
    );

    const result = await runGuard();

    expect(router.serializeUrl(result as UrlTree))
      .toBe("/estado-acceso?tipo=permisos");
  });

  it("distingue HTTP 500 de una sesion vencida", async () => {
    auth.currentUserResult = throwError(
      () => new HttpErrorResponse({ status: 500 }),
    );

    const result = await runGuard();

    expect(router.serializeUrl(result as UrlTree))
      .toBe("/estado-acceso?tipo=temporal");
  });

  it("distingue un error de red de una sesion vencida", async () => {
    auth.currentUserResult = throwError(
      () => new HttpErrorResponse({ status: 0 }),
    );

    const result = await runGuard();

    expect(router.serializeUrl(result as UrlTree))
      .toBe("/estado-acceso?tipo=temporal");
  });
});
