import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  PersonImportPreviewResponse,
} from "../../../person-import.models";
import {
  PersonImportPreviewComponent,
} from "./person-import-preview.component";

describe("PersonImportPreviewComponent", () => {
  let fixture: ComponentFixture<PersonImportPreviewComponent>;
  let component: PersonImportPreviewComponent;

  const preview: PersonImportPreviewResponse = {
    data: {
      uuid: "lote-123",
      original_filename: "personas.xlsx",
      status: "READY",
      total_rows: 2,
      valid_rows: 1,
      invalid_rows: 1,
      processed_rows: 0,
      failed_rows: 0,
      confirmed_at: null,
      started_at: null,
      finished_at: null,
    },
    rows: [
      {
        row_number: 2,
        status: "VALID",
        raw_data: {
          nombres: "MARIA",
          apellido_paterno: "LOPEZ",
        },
        normalized_data: {
          nombres: "MARIA",
          apellido_paterno: "LOPEZ",
        },
        validation_errors: {},
        result_data: null,
      },
      {
        row_number: 3,
        status: "INVALID",
        raw_data: {
          nombres: "",
        },
        normalized_data: {
          nombres: "",
        },
        validation_errors: {
          nombres: ["El nombre es obligatorio."],
        },
        result_data: null,
      },
    ],
    meta: {
      current_page: 1,
      per_page: 50,
      last_page: 2,
      total: 52,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonImportPreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonImportPreviewComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("preview", preview);
    fixture.detectChanges();
  });

  it("muestra numero de fila, estado y datos de personas", () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain("MARIA");
    expect(element.textContent).toContain("LOPEZ");
    expect(element.textContent).toContain("VALID");
    expect(element.textContent).toContain("INVALID");

    expect(
      element.querySelector('[data-testid="person-import-preview"]'),
    ).not.toBeNull();
  });

  it("muestra los errores de validacion por campo", () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain("nombres");
    expect(element.textContent).toContain(
      "El nombre es obligatorio.",
    );
  });

  it("muestra un estado vacio cuando no existen filas", () => {
    fixture.componentRef.setInput("preview", {
      ...preview,
      rows: [],
      meta: {
        current_page: 1,
        per_page: 50,
        last_page: 1,
        total: 0,
      },
    });

    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).textContent,
    ).toContain("No hay registros");
  });

  it("muestra la informacion de paginacion", () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain("Página 1 de 2");
    expect(element.textContent).toContain("52");
  });

  it("emite la solicitud de pagina siguiente", () => {
    const pages: number[] = [];

    component.pageChange.subscribe((page) => {
      pages.push(page);
    });

    const next = button("person-import-preview-next");

    next.click();

    expect(pages).toEqual([2]);
  });

  it("impide solicitar una pagina anterior a la primera", () => {
    const pages: number[] = [];

    component.pageChange.subscribe((page) => {
      pages.push(page);
    });

    const previous = button("person-import-preview-previous");

    expect(previous.disabled).toBe(true);

    previous.click();

    expect(pages).toEqual([]);
  });

  it("reconoce el estado SKIPPED del backend", () => {
    fixture.componentRef.setInput("preview", {
      ...preview,
      rows: [
        {
          ...preview.rows[0],
          status: "SKIPPED",
        },
      ],
    });

    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).textContent,
    ).toContain("SKIPPED");
  });

  function button(testId: string): HTMLButtonElement {
    const element = (
      fixture.nativeElement as HTMLElement
    ).querySelector(`[data-testid="${testId}"]`);

    if (!(element instanceof HTMLButtonElement)) {
      throw new Error(`No se encontró el botón ${testId}.`);
    }

    return element;
  }
});