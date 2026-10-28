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
        r.params.get("buscar") === "Maria",
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

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        'button[type="button"]',
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

  it("muestra errores de consulta", () => {
    fixture.detectChanges();

    http.expectOne(
      (r) => r.url === "/api/usuarios/personas-disponibles",
    ).flush(
      { message: "Error" },
      { status: 503, statusText: "Service Unavailable" },
    );

    fixture.detectChanges();

    expect(component.error()).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]'))
      .not.toBeNull();
  });
});