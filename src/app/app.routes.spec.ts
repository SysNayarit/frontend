import { authGuard } from './auth/auth.guard';
import { personasViewGuard } from './auth/permission.guard';
import { routes } from './app.routes';

describe('routes', () => {
  it('protege el modulo personas con autenticacion y permiso de consulta', () => {
    const personasRoute = routes.find(
      (route) => route.path === 'personas',
    );

    expect(personasRoute).toBeDefined();

    expect(
      personasRoute?.component,
    ).toBeDefined();

    expect(
      personasRoute?.canActivate,
    ).toEqual([
      authGuard,
      personasViewGuard,
    ]);
  });
});
