import { authGuard } from "./auth/auth.guard";
import {
  personasImportGuard,
  personasViewGuard,
  usuariosViewGuard,
} from "./auth/permission.guard";
import { routes } from "./app.routes";

describe("routes", () => {
  it("agrupa inicio y personas bajo un contenedor autenticado persistente", () => {
    const authenticatedRoute = routes.find(
      (route) => route.path === "" && Array.isArray(route.children),
    );

    expect(authenticatedRoute).toBeDefined();

    expect(authenticatedRoute?.component).toBeDefined();

    expect(authenticatedRoute?.canActivateChild).toEqual([authGuard]);

    const inicioRoute = authenticatedRoute?.children?.find(
      (route) => route.path === "inicio",
    );

    expect(inicioRoute).toBeDefined();

    expect(inicioRoute?.component).toBeDefined();
  });

  it("protege personas con el permiso de consulta dentro del area autenticada", () => {
    const authenticatedRoute = routes.find(
      (route) => route.path === "" && Array.isArray(route.children),
    );

    const personasRoute = authenticatedRoute?.children?.find(
      (route) => route.path === "personas",
    );

    expect(personasRoute).toBeDefined();

    expect(personasRoute?.component).toBeDefined();

    expect(personasRoute?.canActivate).toEqual([personasViewGuard]);
  });
  it("protege la importacion de personas con personas.importar", () => {
    const authenticatedRoute = routes.find(
      (route) =>
        route.path === "" &&
        Array.isArray(route.children),
    );

    const importRoute =
      authenticatedRoute?.children?.find(
        (route) =>
          route.path ===
          "personas/importaciones",
      );

    expect(importRoute).toBeDefined();

    expect(
      importRoute?.component,
    ).toBeDefined();

    expect(
      importRoute?.canActivate,
    ).toEqual([
      personasImportGuard,
    ]);
  });

  it("protege usuarios con usuarios.ver dentro del area autenticada", () => {
    const authenticatedRoute = routes.find(
      (route) =>
        route.path === "" &&
        Array.isArray(route.children),
    );

    expect(authenticatedRoute).toBeDefined();
    expect(authenticatedRoute?.canActivateChild)
      .toEqual([authGuard]);

    const usersRoute = authenticatedRoute?.children?.find(
      (route) => route.path === "usuarios",
    );

    expect(usersRoute).toBeDefined();
    expect(usersRoute?.component).toBeDefined();
    expect(usersRoute?.canActivate)
      .toEqual([usuariosViewGuard]);
  });
});
