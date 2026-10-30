import { By } from "@angular/platform-browser";
import { UserCreateFormComponent } from "../../organisms/user-create-form/user-create-form.component";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { AuthContextService } from "../../../../auth/auth-context.service";
import { AvailablePerson } from "../../../user.models";
import { UserRegistrationPageComponent } from "./user-registration-page.component";

describe("UserRegistrationPageComponent", () => {
  let http: HttpTestingController;
  let component: UserRegistrationPageComponent;

  const person: AvailablePerson = {
    id_persona: "00000000-0000-4000-8000-000000000001",
    num_expediente: "1001",
    nombres: "PERSONA",
    apellido_paterno: "PRUEBA",
    apellido_materno: null,
    estatus: "ACTIVO",
  };

  const values = {
    email: "Persona.Prueba@institucional.com",
    password: "ContrasenaTemporalSegura2026!",
    password_confirmation: "ContrasenaTemporalSegura2026!",
    administratorPassword: "ClaveAdministrativaPrivada",
  };

  async function prepare(allowed: boolean) {
    await TestBed.configureTestingModule({
      imports: [UserRegistrationPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthContextService,
          useValue: {
            hasPermission: (permission: string) =>
              allowed && permission === "usuarios.crear",
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(UserRegistrationPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    if (allowed) {
      const request = http.expectOne(
        (req) =>
          req.method === "GET" &&
          req.url === "/api/usuarios/personas-disponibles" &&
          req.params.get("buscar") === "" &&
          req.params.get("page") === "1",
      );

      request.flush({
        data: [person],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: 1,
        },
      });

      fixture.detectChanges();
    }

    return fixture;
  }

  function selectPerson(): void {
    expect(component.personSelectorOpen()).toBe(true);
    component.choosePerson(person);
    expect(component.selectedPerson()).toEqual(person);
  }

  afterEach(() => {
    http?.verify();
  });

  it("presenta la pagina sin operaciones ajenas al registro", async () => {
    const fixture = await prepare(false);
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain("Registro de usuarios");
    expect(text).toContain("No tienes permiso para registrar usuarios.");
    expect(text).not.toContain("Asignación masiva de roles");
    expect(text).not.toContain("Usuarios registrados");
  });

  it("no envia la creacion antes de reautenticar", async () => {
    await prepare(true);
    selectPerson();

    component.confirmCreateUser(values);

    const reauth = http.expectOne("/reauthenticate");
    expect(reauth.request.method).toBe("POST");
    expect(reauth.request.body).toEqual({
      password: values.administratorPassword,
    });

    expect(http.match("/api/usuarios")).toEqual([]);
    expect(component.creatingUser()).toBe(true);

    reauth.flush({});

    const creation = http.expectOne("/api/usuarios");
    expect(creation.request.method).toBe("POST");
    expect(creation.request.body).toEqual({
      id_persona: person.id_persona,
      email: "persona.prueba@institucional.com",
      password: values.password,
      password_confirmation: values.password_confirmation,
    });

    expect(JSON.stringify(creation.request.body)).not.toContain(
      values.administratorPassword,
    );

    creation.flush({
      id: 25,
      id_persona: person.id_persona,
      name: "PERSONA PRUEBA",
      email: "persona.prueba@institucional.com",
    });

    expect(component.creatingUser()).toBe(false);
    expect(component.selectedPerson()).toBeNull();
    expect(component.createUserNotice()).toContain(
      "Usuario creado correctamente",
    );
  });

  it("no crea una cuenta cuando falla la reautenticacion", async () => {
    await prepare(true);
    selectPerson();

    component.confirmCreateUser(values);

    http
      .expectOne("/reauthenticate")
      .flush(
        { message: "Credenciales invalidas" },
        { status: 422, statusText: "Unprocessable Entity" },
      );

    expect(http.match("/api/usuarios")).toEqual([]);
    expect(component.creatingUser()).toBe(false);
    expect(component.createUserError()).toContain(
      "contraseña del administrador",
    );
  });

  it("evita solicitudes duplicadas mientras se procesa el alta", async () => {
    await prepare(true);
    selectPerson();

    component.confirmCreateUser(values);
    component.confirmCreateUser(values);

    expect(http.match("/api/usuarios")).toEqual([]);

    const requests = http.match("/reauthenticate");
    expect(requests.length).toBe(1);

    requests[0].flush({});

    component.confirmCreateUser(values);

    const creation = http.expectOne("/api/usuarios");

    creation.flush({
      id: 26,
      id_persona: person.id_persona,
      name: "PERSONA PRUEBA",
      email: "persona.prueba@institucional.com",
    });

    expect(component.creatingUser()).toBe(false);
  });

  it("conserva la Persona cuando Laravel rechaza el registro", async () => {
    await prepare(true);
    selectPerson();

    component.confirmCreateUser(values);
    http.expectOne("/reauthenticate").flush({});

    http
      .expectOne("/api/usuarios")
      .flush(
        { message: "La Persona ya tiene usuario" },
        { status: 422, statusText: "Unprocessable Entity" },
      );

    expect(component.selectedPerson()).toEqual(person);
    expect(component.creatingUser()).toBe(false);
    expect(component.createUserError()).toContain(
      "Persona ya tiene una cuenta",
    );
  });

  it("selecciona Persona desde la interfaz sin crear cuenta anticipadamente", async () => {
    const fixture = await prepare(true);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector("app-available-person-selector tbody button[type='button']");
    button.click(); await fixture.whenStable(); fixture.detectChanges();
    expect(component.selectedPerson()?.id_persona).toBe(person.id_persona);
    expect(fixture.nativeElement.querySelector('app-user-create-form')).not.toBeNull();
    http.expectNone(req => req.method === "POST");
  });

  for (const status of [403, 422, 423, 503]) {
    it(`conserva Persona y borra credenciales ante rechazo HTTP ${status}`, async () => {
      const fixture = await prepare(true); selectPerson(); fixture.detectChanges();
      const form = fixture.debugElement.query(By.directive(UserCreateFormComponent)).componentInstance as UserCreateFormComponent;
      form.form.setValue(values);
      component.confirmCreateUser(values);
      http.expectOne("/reauthenticate").flush(null);
      http.expectOne("/api/usuarios").flush({}, { status, statusText: "Rejected" });
      expect(component.selectedPerson()).not.toBeNull();
      expect(component.createUserError()).not.toBeNull();
      expect(form.form.controls.password.value).toBe("");
      expect(form.form.controls.password_confirmation.value).toBe("");
      expect(form.form.controls.administratorPassword.value).toBe("");
    });
  }

  it("cancelar descarta credenciales sin enviar solicitudes de creacion", async () => {
    const fixture = await prepare(true); selectPerson(); fixture.detectChanges();
    const form = fixture.debugElement.query(By.directive(UserCreateFormComponent)).componentInstance as UserCreateFormComponent;
    form.form.setValue(values); component.cancelCreateUser();
    expect(component.selectedPerson()).toBeNull();
    expect(form.form.controls.password.value).toBe("");
    expect(form.form.controls.password_confirmation.value).toBe("");
    expect(form.form.controls.administratorPassword.value).toBe("");
    http.expectNone(req => req.method === "POST");
    // Se mantiene la selección de Persona como acción explícita.
  });

  it("informa que la nueva cuenta queda pendiente de habilitacion", async () => {
    await prepare(true); selectPerson(); component.confirmCreateUser(values);
    http.expectOne("/reauthenticate").flush(null);
    http.expectOne("/api/usuarios").flush({ id: 44, id_persona: person.id_persona, name: "PERSONA", email: values.email, access_status: "PENDIENTE" });
    expect(component.createUserNotice()).toContain("PENDIENTE");
    expect(component.createUserNotice()).toContain("todavía no permite iniciar sesión");
  });
});
