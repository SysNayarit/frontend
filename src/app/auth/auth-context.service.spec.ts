import { HttpErrorResponse } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
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
        {
          provide: AuthService,
          useClass: AuthServiceStub,
        },
      ],
    });

    context = TestBed.inject(AuthContextService);

    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;
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
});
