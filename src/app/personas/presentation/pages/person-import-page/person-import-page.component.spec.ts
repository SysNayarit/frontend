import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { Subject } from "rxjs";

import {
  PersonImportPreviewResponse,
  PersonImportUploadResponse,
} from "../../../person-import.models";
import { PersonImportService } from "../../../person-import.service";
import { PersonImportPageComponent } from "./person-import-page.component";

describe("PersonImportPageComponent", () => {
  let fixture: ComponentFixture<PersonImportPageComponent>;
  let uploadResponse$: Subject<PersonImportUploadResponse>;
  let uploadedFiles: File[];
  let previewRequests: Array<{
    uuid: string;
    page: number;
    response$: Subject<PersonImportPreviewResponse>;
  }>;

  beforeEach(async () => {
    uploadResponse$ = new Subject<PersonImportUploadResponse>();
    uploadedFiles = [];
    previewRequests = [];

    const importService = {
      upload(file: File) {
        uploadedFiles.push(file);
        return uploadResponse$.asObservable();
      },
      getBatch(uuid: string, page = 1) {
        const response$ = new Subject<PersonImportPreviewResponse>();
        previewRequests.push({ uuid, page, response$ });
        return response$.asObservable();
      },
    };

    await TestBed.configureTestingModule({
      imports: [PersonImportPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: PersonImportService,
          useValue: importService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonImportPageComponent);
    fixture.detectChanges();
  });

  it("muestra la identidad visual de importacion y permite volver a Personas", () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="person-import-page"]'),
    ).not.toBeNull();

    expect(element.textContent).toContain("Importar personas");

    expect(element.textContent).toContain(
      "Carga, valida y revisa un archivo XLSX",
    );

    const backLink = element.querySelector(
      '[data-testid="person-import-back"]',
    ) as HTMLAnchorElement | null;

    expect(backLink).not.toBeNull();
    expect(backLink?.getAttribute("href")).toBe("/personas");
    expect(backLink?.textContent).toContain("Volver a Personas");
  });

  it("identifica la pagina dentro de la navegacion del modulo", () => {
    const navigation = elementByTestId(
      fixture,
      "module-navigation-current",
    );

    expect(navigation.textContent).toContain("Importación de personas");
  });

  it("mantiene deshabilitada la carga hasta seleccionar un XLSX", () => {
    const button = buttonByTestId("person-import-upload");

    expect(button.disabled).toBe(true);
    expect(uploadedFiles).toHaveLength(0);
  });

  it("muestra el archivo XLSX seleccionado y habilita la carga", () => {
    selectFile(new File(["xlsx"], "personas.xlsx"));

    const selected = elementByTestId(
      fixture,
      "person-import-selected-file",
    );

    expect(selected.textContent).toContain("personas.xlsx");
    expect(buttonByTestId("person-import-upload").disabled).toBe(false);
  });

  it("permite reemplazar el archivo antes de cargarlo", () => {
    selectFile(new File(["primero"], "primero.xlsx"));
    selectFile(new File(["segundo"], "segundo.xlsx"));

    const selected = elementByTestId(
      fixture,
      "person-import-selected-file",
    );

    expect(selected.textContent).toContain("segundo.xlsx");
    expect(selected.textContent).not.toContain("primero.xlsx");

    buttonByTestId("person-import-upload").click();

    expect(uploadedFiles).toHaveLength(1);
    expect(uploadedFiles[0]?.name).toBe("segundo.xlsx");
  });

  it("envia el XLSX una sola vez y bloquea duplicados durante la carga", () => {
    const file = new File(["contenido"], "personas.xlsx");

    selectFile(file);

    const button = buttonByTestId("person-import-upload");

    button.click();
    fixture.detectChanges();

    expect(uploadedFiles).toHaveLength(1);
    expect(uploadedFiles[0]).toBe(file);
    expect(button.disabled).toBe(true);

    button.click();

    expect(uploadedFiles).toHaveLength(1);
  });

  it("muestra el resumen del lote devuelto por el backend", () => {
    selectFile(new File(["contenido"], "personas.xlsx"));
    buttonByTestId("person-import-upload").click();

    uploadResponse$.next({
      data: {
        uuid: "lote-123",
        original_filename: "personas.xlsx",
        status: "READY",
        total_rows: 10,
        valid_rows: 8,
        invalid_rows: 2,
        processed_rows: 0,
        failed_rows: 0,
        confirmed_at: null,
        started_at: null,
        finished_at: null,
      },
    });
    uploadResponse$.complete();

    fixture.detectChanges();

    const summary = elementByTestId(
      fixture,
      "person-import-summary",
    );

    expect(summary.textContent).toContain("personas.xlsx");
    expect(summary.textContent).toContain("READY");
    expect(summary.textContent).toContain("10");
    expect(summary.textContent).toContain("8");
    expect(summary.textContent).toContain("2");
    expect(summary.textContent).toContain("lote-123");
  });

  it("informa errores y permite reintentar con el archivo seleccionado", () => {
    const file = new File(["contenido"], "personas.xlsx");

    selectFile(file);
    buttonByTestId("person-import-upload").click();

    uploadResponse$.error(new Error("Error de carga"));
    fixture.detectChanges();

    const error = elementByTestId(
      fixture,
      "person-import-error",
    );

    expect(error.textContent).toContain("Error");
    expect(
      elementByTestId(fixture, "person-import-selected-file").textContent,
    ).toContain("personas.xlsx");

    expect(buttonByTestId("person-import-upload").disabled).toBe(false);
  });

  it("rechaza archivos que no sean XLSX sin llamar al servicio", () => {
    selectFile(new File(["contenido"], "personas.csv"));

    expect(buttonByTestId("person-import-upload").disabled).toBe(true);
    expect(uploadedFiles).toHaveLength(0);

    const error = elementByTestId(
      fixture,
      "person-import-error",
    );

    expect(error.textContent).toContain(".xlsx");
  });

  it("deshabilita la carga cuando se cancela la seleccion", () => {
    selectFile(new File(["contenido"], "personas.xlsx"));

    const input = elementByTestId(
      fixture,
      "person-import-file",
    ) as HTMLInputElement;

    Object.defineProperty(input, "files", {
      configurable: true,
      value: {
        length: 0,
        item: () => null,
      },
    });

    input.dispatchEvent(new Event("change", { bubbles: true }));
    fixture.detectChanges();

    expect(buttonByTestId("person-import-upload").disabled).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="person-import-selected-file"]',
      ),
    ).toBeNull();
  });

  it("limpia el resumen anterior al seleccionar otro archivo", () => {
    selectFile(new File(["primero"], "primero.xlsx"));
    buttonByTestId("person-import-upload").click();

    uploadResponse$.next({
      data: {
        uuid: "lote-anterior",
        original_filename: "primero.xlsx",
        status: "READY",
        total_rows: 3,
        valid_rows: 3,
        invalid_rows: 0,
        processed_rows: 0,
        failed_rows: 0,
        confirmed_at: null,
        started_at: null,
        finished_at: null,
      },
    });
    uploadResponse$.complete();

    fixture.detectChanges();

    expect(
      elementByTestId(fixture, "person-import-summary").textContent,
    ).toContain("lote-anterior");

    selectFile(new File(["segundo"], "segundo.xlsx"));

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="person-import-summary"]',
      ),
    ).toBeNull();

    expect(
      elementByTestId(fixture, "person-import-selected-file").textContent,
    ).toContain("segundo.xlsx");
  });
  it("consulta automaticamente el preview despues de cargar el XLSX", () => {
    uploadReadyBatch();

    expect(previewRequests).toHaveLength(1);
    expect(previewRequests[0]?.uuid).toBe("lote-preview");
    expect(previewRequests[0]?.page).toBe(1);

    expect(
      elementByTestId(fixture, "person-import-preview-loading").textContent,
    ).toContain("Consultando");
  });

  it("presenta las filas y errores recibidos del GET", () => {
    uploadReadyBatch();

    previewRequests[0]!.response$.next(previewResponse());
    previewRequests[0]!.response$.complete();
    fixture.detectChanges();

    const preview = elementByTestId(
      fixture,
      "person-import-preview",
    );

    expect(preview.textContent).toContain("MARIA");
    expect(preview.textContent).toContain("INVALID");
    expect(preview.textContent).toContain(
      "El nombre es obligatorio.",
    );
  });

  it("solicita la segunda pagina desde el organismo", () => {
    uploadReadyBatch();

    previewRequests[0]!.response$.next(previewResponse());
    previewRequests[0]!.response$.complete();
    fixture.detectChanges();

    buttonByTestId("person-import-preview-next").click();

    expect(previewRequests).toHaveLength(2);
    expect(previewRequests[1]?.uuid).toBe("lote-preview");
    expect(previewRequests[1]?.page).toBe(2);
  });

  it("informa un error del GET sin borrar el resumen del lote", () => {
    uploadReadyBatch();

    previewRequests[0]!.response$.error(
      new Error("Consulta no disponible"),
    );
    fixture.detectChanges();

    expect(
      elementByTestId(fixture, "person-import-preview-error").textContent,
    ).toContain("No se pudo consultar");

    expect(
      elementByTestId(fixture, "person-import-summary").textContent,
    ).toContain("lote-preview");
  });

  it("descarta respuestas de preview anteriores al cambiar el XLSX", () => {
    uploadReadyBatch();

    selectFile(new File(["nuevo"], "nuevo.xlsx"));

    previewRequests[0]!.response$.next(previewResponse());
    previewRequests[0]!.response$.complete();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="person-import-preview"]',
      ),
    ).toBeNull();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="person-import-summary"]',
      ),
    ).toBeNull();
  });

  it("cancela la consulta anterior al solicitar otra pagina", () => {
    uploadReadyBatch();

    const firstRequest = previewRequests[0];

    expect(firstRequest).toBeDefined();
    expect(firstRequest!.response$.observed).toBe(true);

    fixture.componentInstance.loadPreview(2);

    expect(previewRequests).toHaveLength(2);
    expect(firstRequest!.response$.observed).toBe(false);
    expect(previewRequests[1]!.response$.observed).toBe(true);

    firstRequest!.response$.next(previewResponse());
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="person-import-preview"]',
      ),
    ).toBeNull();

    expect(
      elementByTestId(fixture, "person-import-preview-loading").textContent,
    ).toContain("Consultando");
  });
  function uploadReadyBatch(): void {
    selectFile(new File(["contenido"], "personas.xlsx"));
    buttonByTestId("person-import-upload").click();

    uploadResponse$.next({
      data: {
        uuid: "lote-preview",
        original_filename: "personas.xlsx",
        status: "READY",
        total_rows: 52,
        valid_rows: 51,
        invalid_rows: 1,
        processed_rows: 0,
        failed_rows: 0,
        confirmed_at: null,
        started_at: null,
        finished_at: null,
      },
    });
    uploadResponse$.complete();
    fixture.detectChanges();
  }

  function previewResponse(): PersonImportPreviewResponse {
    return {
      data: {
        uuid: "lote-preview",
        original_filename: "personas.xlsx",
        status: "READY",
        total_rows: 52,
        valid_rows: 51,
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
          status: "INVALID",
          raw_data: { nombres: "MARIA" },
          normalized_data: { nombres: "MARIA" },
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
  }
  function buttonByTestId(testId: string): HTMLButtonElement {
    const element = elementByTestId(fixture, testId);

    if (!(element instanceof HTMLButtonElement)) {
      throw new Error(`No se encontró el botón ${testId}.`);
    }

    return element;
  }

  function selectFile(file: File): void {
    const input = elementByTestId(
      fixture,
      "person-import-file",
    );

    if (!(input instanceof HTMLInputElement)) {
      throw new Error("No se encontró el selector XLSX.");
    }

    const files = {
      0: file,
      length: 1,
      item(index: number): File | null {
        return index === 0 ? file : null;
      },
    };

    Object.defineProperty(input, "files", {
      configurable: true,
      value: files,
    });

    input.dispatchEvent(new Event("change", { bubbles: true }));
    fixture.detectChanges();
  }
});

function elementByTestId(
  fixture: ComponentFixture<PersonImportPageComponent>,
  testId: string,
): HTMLElement {
  const element = (fixture.nativeElement as HTMLElement).querySelector(
    `[data-testid="${testId}"]`,
  );

  if (!(element instanceof HTMLElement)) {
    throw new Error(`No se encontró ${testId}.`);
  }

  return element;
}