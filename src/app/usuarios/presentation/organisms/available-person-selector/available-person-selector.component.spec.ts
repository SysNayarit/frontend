import { AvailablePerson } from "../../../user.models";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AvailablePersonSelectorComponent } from "./available-person-selector.component";

describe("AvailablePersonSelectorComponent", () => {
  let fixture: ComponentFixture<AvailablePersonSelectorComponent>;
  let component: AvailablePersonSelectorComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailablePersonSelectorComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AvailablePersonSelectorComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function respond(data: unknown[] = [], page = 1, total = 0): void {
    const request = http.expectOne(
      (r) =>
        r.url === "/api/usuarios/personas-disponibles" &&
        r.params.get("page") === String(page),
    );

    request.flush({
      data,
      meta: {
        current_page: page,
        per_page: 20,
        last_page: Math.max(1, Math.ceil(total / 20)),
        total,
      },
    });
  }

  it("consulta Personas al iniciar", () => {
    fixture.detectChanges();
    respond();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.persons()).toEqual([]);
  });

  it("busca por nombre", () => {
    fixture.detectChanges();
    respond();

    component.searchText.set("Maria");
    component.search(new Event("submit"));

    const request = http.expectOne(
      (r) =>
        r.url === "/api/usuarios/personas-disponibles" &&
        r.params.get("persona") === "Maria",
    );

    expect(request.request.method).toBe("GET");

    request.flush({
      data: [],
      meta: {
        current_page: 1,
        per_page: 20,
        last_page: 1,
        total: 0,
      },
    });
  });

  it("permite seleccionar una Persona", () => {
    const person: AvailablePerson = {
      id_persona: "00000000-0000-4000-8000-000000000001",
      num_expediente: "123",
      nombres: "MARIA",
      apellido_paterno: "PRUEBA",
      apellido_materno: null,
      estatus: "ACTIVO",
    };

    let selected: typeof person | undefined;
    component.personSelected.subscribe((value) => {
      selected = value;
    });

    fixture.detectChanges();
    respond([person], 1, 1);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      'tbody button[type="button"]',
    );

    button.click();

    expect(selected?.id_persona).toBe(person.id_persona);
  });

  it("pagina los resultados", () => {
    fixture.detectChanges();
    respond([], 1, 21);
    fixture.detectChanges();

    component.loadPage(2);
    respond([], 2, 21);

    expect(component.page()).toBe(2);
  });

  it("muestra fecha y origen del registro en la tabla", () => {
    const base = {
      id_persona: "00000000-0000-4000-8000-000000000001",
      num_expediente: "2026-00000001",
      nombres: "PERSONA",
      apellido_paterno: "PRUEBA",
      apellido_materno: null,
      estatus: "ACTIVO",
      fecha_registro: "2026-10-28T18:30:00Z",
    };

    const persons: AvailablePerson[] = [
      {
        ...base,
        forma_registro: "INDIVIDUAL",
      },
      {
        ...base,
        id_persona: "00000000-0000-4000-8000-000000000002",
        forma_registro: "MASIVO",
      },
      {
        ...base,
        id_persona: "00000000-0000-4000-8000-000000000003",
        forma_registro: "NO_DETERMINADO",
      },
    ];

    fixture.detectChanges();
    respond(persons, 1, 3);
    fixture.detectChanges();

    const table: HTMLTableElement =
      fixture.nativeElement.querySelector("table");

    expect(table).not.toBeNull();

    const headers = Array.from(
      table.querySelectorAll("thead th"),
      (element) => {
        const label = element.querySelector("label");
        const title = element.querySelector("span");

        return (label?.textContent ?? title?.textContent ?? "").trim();
      },
    );

    expect(headers).toContain("Fecha y hora de registro");
    expect(headers).toContain("Origen del registro");

    const rows = Array.from(table.querySelectorAll("tbody tr"));

    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain("Registro individual");
    expect(rows[1].textContent).toContain("Importación de archivo");
    expect(rows[2].textContent).toContain("No determinado");

    for (const row of rows) {
      expect(row.textContent).toMatch(/28\/10\/2026.*12:30/);
    }
  });

  it("muestra No disponible cuando falta la fecha", () => {
    expect(component.formatRegistrationDate(null)).toBe("No disponible");
    expect(component.formatRegistrationDate("fecha-invalida")).toBe(
      "No disponible",
    );
  });

  it("no atribuye origen individual cuando no existe evidencia", () => {
    expect(component.registrationOriginLabel(undefined)).toBe("No determinado");
    expect(component.registrationOriginLabel("NO_DETERMINADO")).toBe(
      "No determinado",
    );
  });
  it("muestra errores de consulta", () => {
    fixture.detectChanges();

    http
      .expectOne((r) => r.url === "/api/usuarios/personas-disponibles")
      .flush(
        { message: "Error" },
        { status: 503, statusText: "Service Unavailable" },
      );

    fixture.detectChanges();

    expect(component.error()).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]'),
    ).not.toBeNull();
  });
});
