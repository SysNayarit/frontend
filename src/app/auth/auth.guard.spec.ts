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
import { authGuard } from './auth.guard';

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
  });

  currentUser(): Observable<AuthenticatedUser> {
    return this.currentUserResult;
  }
}

describe('authGuard', () => {
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

  async function runGuard(): Promise<boolean | UrlTree> {
    const result = TestBed.runInInjectionContext(
      () =>
        authGuard(
          {} as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ),
    );

    return firstValueFrom(
      result as Observable<boolean | UrlTree>,
    );
  }

  it('permite acceder cuando existe una sesion valida', async () => {
    const result = await runGuard();

    expect(result).toBe(true);
  });

  it('redirige al login cuando el backend responde 401', async () => {
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
    ).toBe('/login');
  });
});
