import { HttpErrorResponse } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { Observable, of, Subject, throwError } from "rxjs";

import { AuthenticatedUser } from "./auth.models";
import { AuthContextService } from "./auth-context.service";
import { AuthService } from "./auth.service";

class AuthServiceStub {
  currentUserCalls = 0;

  currentUserResult!: Observable<AuthenticatedUser>;

  readonly user: AuthenticatedUser = {
    id: 1,
    id_persona: null,
    name: "admin",
    email: "admin@imail.com",
    email_verified_at: null,
    created_at: "2026-10-09T00:00:00.000000Z",
    updated_at: "2026-10-09T00:00:00.000000Z",
    person: null,
    permissions: ["personas.ver"],
  };

  constructor() {
    this.currentUserResult = of(this.user);
  }

  currentUser(): Observable<AuthenticatedUser> {
    this.currentUserCalls += 1;

    return this.currentUserResult;
  }
}

describe("AuthContextService", () => {
  let context: AuthContextService;
  let auth: AuthServiceStub;

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

    context = TestBed.inject(AuthContextService);

    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;
  });

  it("una revocacion desde otra pestana limpia el contexto", () => {
    context.refresh().subscribe();

    expect(context.hasPermission("personas.ver")).toBe(true);

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, "navigateByUrl")
      .mockResolvedValue(true);

    window.dispatchEvent(new StorageEvent("storage", {
      key: "siga:auth:cross-tab",
      newValue: JSON.stringify({
        type: "logout",
        nonce: "prueba-externa",
      }),
    }));

    expect(context.user()).toBeNull();
    expect(context.hasPermission("personas.ver")).toBe(false);
    expect(navigate).toHaveBeenCalledWith(
      "/acceso?estado=sesion-finalizada",
      { replaceUrl: true },
    );
  });

  it("otra pestana solicita permisos actualizados a Laravel", () => {
    context.refresh().subscribe();

    expect(context.hasPermission("personas.ver")).toBe(true);

    auth.currentUserResult = of({
      ...auth.user,
      permissions: [],
    });

    window.dispatchEvent(new StorageEvent("storage", {
      key: "siga:auth:cross-tab",
      newValue: JSON.stringify({
        type: "permissions",
        nonce: "prueba-permisos",
      }),
    }));

    expect(auth.currentUserCalls).toBe(2);
    expect(context.hasPermission("personas.ver")).toBe(false);
  });
  it("descarta una respuesta de permisos anterior a la revalidacion", () => {
    const anterior = new Subject<AuthenticatedUser>();
    auth.currentUserResult = anterior.asObservable();

    let respuestaAntigua = false;

    context.refresh().subscribe({
      next: () => { respuestaAntigua = true; },
      error: () => undefined,
    });

    const renovado = {
      ...auth.user,
      permissions: [] as string[],
    };

    auth.currentUserResult = of(renovado);

    let respuestaNueva: AuthenticatedUser | undefined;

    context.revalidate().subscribe({
      next: user => { respuestaNueva = user; },
    });

    anterior.next(auth.user);
    anterior.complete();

    expect(auth.currentUserCalls).toBe(2);
    expect(respuestaAntigua).toBe(false);
    expect(respuestaNueva).toEqual(renovado);
    expect(context.user()).toEqual(renovado);
    expect(context.hasPermission("personas.ver")).toBe(false);
  });
  it("refresca el usuario desde el backend", () => {
    let received: AuthenticatedUser | undefined;

    context.refresh().subscribe((user) => {
      received = user;
    });

    expect(auth.currentUserCalls).toBe(1);
    expect(received).toEqual(auth.user);
    expect(context.user()).toEqual(auth.user);
  });

  it("reutiliza el usuario ya cargado sin repetir la consulta", () => {
    context.refresh().subscribe();

    context.ensureCurrent().subscribe();

    expect(auth.currentUserCalls).toBe(1);
  });

  it("deduplica consultas concurrentes", () => {
    const response = new Subject<AuthenticatedUser>();

    auth.currentUserResult = response.asObservable();

    context.refresh().subscribe();
    context.refresh().subscribe();

    expect(auth.currentUserCalls).toBe(1);

    response.next(auth.user);
    response.complete();

    expect(context.user()).toEqual(auth.user);
  });

  it("expone permisos solo desde el usuario cargado", () => {
    expect(context.hasPermission("personas.ver")).toBe(false);

    context.refresh().subscribe();

    expect(context.hasPermission("personas.ver")).toBe(true);
  });

  it("conserva el contexto ante una excepcion no HTTP", () => {
    context.refresh().subscribe();

    auth.currentUserResult = throwError(() => new Error("Error inesperado"));

    context.refresh().subscribe({
      error: () => undefined,
    });

    expect(context.user()).toEqual(auth.user);
  });

  it("permite limpiar explicitamente el usuario", () => {
    context.refresh().subscribe();

    context.clear();

    expect(context.user()).toBeNull();
  });

  it("limpia el usuario cuando el backend devuelve 401", () => {
    context.refresh().subscribe();

    auth.currentUserResult = throwError(
      () => new HttpErrorResponse({ status: 401 }),
    );

    context.refresh().subscribe({
      error: () => undefined,
    });

    expect(context.user()).toBeNull();
    expect(context.hasPermission("personas.ver")).toBe(false);
  });

  it("conserva el contexto anterior ante un error HTTP 500", () => {
    context.refresh().subscribe();

    auth.currentUserResult = throwError(
      () => new HttpErrorResponse({ status: 500 }),
    );

    context.refresh().subscribe({
      error: () => undefined,
    });

    expect(context.user()).toEqual(auth.user);
  });

  it("conserva el contexto anterior ante un error de red", () => {
    context.refresh().subscribe();

    auth.currentUserResult = throwError(
      () => new HttpErrorResponse({ status: 0 }),
    );

    context.refresh().subscribe({
      error: () => undefined,
    });

    expect(context.user()).toEqual(auth.user);
  });

  it("conserva la sesion ante una respuesta HTTP 403", () => {
    context.refresh().subscribe();

    auth.currentUserResult = throwError(
      () => new HttpErrorResponse({ status: 403 }),
    );

    context.refresh().subscribe({
      error: () => undefined,
    });

    expect(context.user()).toEqual(auth.user);
  });

  it("descarta el usuario recibido despues de limpiar una sesion", () => {
    const response = new Subject<AuthenticatedUser>();
    auth.currentUserResult = response.asObservable();
    let emitted = false;
    context.refresh().subscribe(() => emitted = true);
    context.clear();
    response.next(auth.user);
    response.complete();
    expect(emitted).toBe(false);
    expect(context.user()).toBeNull();
  });

  it("una respuesta antigua no sobrescribe el contexto renovado", () => {
    const response = new Subject<AuthenticatedUser>();
    auth.currentUserResult = response.asObservable();
    context.refresh().subscribe();
    context.clear();
    const renewed = { ...auth.user, name: "Sesion nueva" };
    auth.currentUserResult = of(renewed);
    context.refresh().subscribe();
    response.next(auth.user);
    response.complete();
    expect(context.user()?.name).toBe("Sesion nueva");
  });
});
