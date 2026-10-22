import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, Subject } from "rxjs";

import {
  PersonImportPreviewResponse,
  PersonImportUploadResponse,
} from "../../../person-import.models";
import {
  PersonImportConfirmationError,
  PersonImportConfirmationService,
} from "../../../person-import-confirmation.service";
import { PersonImportService } from "../../../person-import.service";
import { PersonImportPageComponent } from "./person-import-page.component";

describe("PersonImportPageComponent", () => {
  let fixture: ComponentFixture<PersonImportPageComponent>;
  let uploadResponse$: Subject<PersonImportUploadResponse>;
  let confirmationResponse$: Subject<PersonImportUploadResponse>;
  let confirmationRequests: Array<{
    uuid: string;
    password: string;
  }>;
  let uploadedFiles: File[];
  let historyPages: number[];
  let previewRequests: Array<{
    uuid: string;
    page: number;
    response$: Subject<PersonImportPreviewResponse>;
  }>;

  beforeEach(async () => {
    uploadResponse$ = new Subject<PersonImportUploadResponse>();
    confirmationResponse$ = new Subject<PersonImportUploadResponse>();
    confirmationRequests = [];
    uploadedFiles = [];
    historyPages = [];
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
      getHistory(page = 1) {
        historyPages.push(page);
        return of({
          data: [],
          meta: {
            current_page: page,
            per_page: 15,
            last_page: 1,
            total: 0,
          },
        });
      },
    };

    await TestBed.configureTestingModule({
      imports: [PersonImportPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: PersonImportConfirmationService,
          useValue: {
            confirm(uuid: string, password: string) {
              confirmationRequests.push({ uuid, password });
              return confirmationResponse$.asObservable();
            },
          },
        },
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

  it("prepara el XLSX sin cargarlo hasta confirmar la accion", () => {
    const file = new File(["contenido"], "personas.xlsx");

    selectFile(file);

    expect(uploadedFiles).toHaveLength(0);
    expect(fixture.componentInstance.selectedFile()).toBe(file);
    expect(fixture.componentInstance.isUploading()).toBe(false);
    expect(buttonByTestId("person-import-upload").disabled).toBe(false);
  });
  it("abre y cierra resultados con el mismo boton", () => {
    const uuid = "01900000-0000-7000-8000-000000000098";

    consultHistoricalBatch(uuid);

    expect(fixture.componentInstance.expandedHistoryUuid()).toBe(uuid);
    expect(previewRequests).toHaveLength(1);

    let button = buttonByTestId("person-import-history-consult");
    expect(button.textContent).toContain("Cerrar resultados");
    expect(button.getAttribute("aria-expanded")).toBe("true");

    button.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.expandedHistoryUuid()).toBeNull();
    expect(fixture.componentInstance.selectedHistoryUuid()).toBe(uuid);

    button = buttonByTestId("person-import-history-consult");
    expect(button.textContent).toContain("Consultar resultados");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(previewRequests[0]!.response$.observed).toBe(false);
  });

  it("conserva el resaltado azul despues de cerrar resultados", () => {
    const uuid = "01900000-0000-7000-8000-000000000098";

    consultHistoricalBatch(uuid);

    buttonByTestId("person-import-history-consult").click();
    fixture.detectChanges();

    const row = elementByTestId(
      fixture,
      "person-import-history-item",
    );

    expect(fixture.componentInstance.selectedHistoryUuid()).toBe(uuid);
    expect(row.classList.contains("bg-blue-50")).toBe(true);
    expect(row.classList.contains("border-blue-500")).toBe(true);

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="person-import-history-expanded"]',
      ),
    ).toBeNull();
  });
  it("muestra los indicadores de los distintos estados del historial", () => {
    const cases = [
      {
        status: "READY",
        invalid_rows: 2,
        failed_rows: 0,
        label: "Con observaciones",
        css: "bg-amber-100",
      },
      {
        status: "READY",
        invalid_rows: 0,
        failed_rows: 0,
        label: "Listo para cargar",
        css: "bg-blue-100",
      },
      {
        status: "COMPLETED",
        invalid_rows: 0,
        failed_rows: 0,
        label: "Cargado",
        css: "bg-green-100",
      },
      {
        status: "COMPLETED",
        invalid_rows: 0,
        failed_rows: 2,
        label: "Cargado con incidencias",
        css: "bg-red-100",
      },
      {
        status: "FAILED",
        invalid_rows: 0,
        failed_rows: 1,
        label: "Error de procesamiento",
        css: "bg-red-100",
      },
    ] as const;

    for (const item of cases) {
      fixture.componentInstance.history.set({
        data: [
          {
            ...previewResponse().data,
            ...item,
            created_at: "2026-10-22T18:00:00.000Z",
          },
        ],
        meta: {
          current_page: 1,
          per_page: 15,
          last_page: 1,
          total: 1,
        },
      });

      fixture.detectChanges();

      const row = elementByTestId(fixture, "person-import-history-item");
      const indicator = Array.from(row.querySelectorAll("span")).find(
        (element) => element.textContent?.trim() === item.label,
      );

      expect(indicator).toBeDefined();
      expect(indicator?.classList.contains(item.css)).toBe(true);
    }
  });

  it("distingue las tres fechas de una importacion", () => {
    const received = "2026-10-22T18:00:00.000Z";
    const confirmed = "2026-10-22T18:15:00.000Z";
    const finished = "2026-10-22T18:25:00.000Z";
    const component = fixture.componentInstance;

    component.history.set({
      data: [
        {
          ...previewResponse().data,
          created_at: received,
          confirmed_at: confirmed,
          finished_at: finished,
        },
      ],
      meta: {
        current_page: 1,
        per_page: 15,
        last_page: 1,
        total: 1,
      },
    });

    fixture.detectChanges();

    const content = elementByTestId(
      fixture,
      "person-import-history-item",
    ).textContent ?? "";

    expect(content).toContain(
      "Archivo recibido: " + component.historyDate(received),
    );
    expect(content).toContain(
      "Carga confirmada: " + component.historyDate(confirmed),
    );
    expect(content).toContain(
      "Procesamiento finalizado:",
    );
    expect(content).toContain(component.historyDate(finished));
    expect(component.historyDate("fecha-invalida"))
      .toBe("Fecha no disponible");
  });

  it("solicita la segunda pagina mediante el historial", () => {
    const component = fixture.componentInstance;

    component.history.set({
      data: [
        {
          ...previewResponse().data,
          created_at: "2026-10-22T18:00:00.000Z",
        },
      ],
      meta: {
        current_page: 1,
        per_page: 15,
        last_page: 2,
        total: 16,
      },
    });

    fixture.detectChanges();

    const section = elementByTestId(fixture, "person-import-history");
    const next = Array.from(section.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Siguiente",
    );

    expect(next).toBeDefined();
    expect(next?.disabled).toBe(false);

    next?.click();

    expect(historyPages).toEqual([1, 2]);
  });

  it("cambia la seleccion y cancela el preview del archivo anterior", () => {
    const first = "01900000-0000-7000-8000-000000000098";
    const second = "01900000-0000-7000-8000-000000000099";
    const component = fixture.componentInstance;

    component.history.set({
      data: [
        {
          ...previewResponse().data,
          uuid: first,
          original_filename: "primero.xlsx",
          created_at: "2026-10-22T18:00:00.000Z",
        },
        {
          ...previewResponse().data,
          uuid: second,
          original_filename: "segundo.xlsx",
          created_at: "2026-10-22T18:05:00.000Z",
        },
      ],
      meta: {
        current_page: 1,
        per_page: 15,
        last_page: 1,
        total: 2,
      },
    });

    fixture.detectChanges();

    let buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '[data-testid="person-import-history-consult"]',
      ),
    ) as HTMLButtonElement[];

    buttons[0]!.click();
    fixture.detectChanges();

    expect(component.selectedHistoryUuid()).toBe(first);
    expect(component.expandedHistoryUuid()).toBe(first);
    expect(previewRequests[0]?.uuid).toBe(first);

    buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '[data-testid="person-import-history-consult"]',
      ),
    ) as HTMLButtonElement[];

    buttons[1]!.click();
    fixture.detectChanges();

    expect(component.selectedHistoryUuid()).toBe(second);
    expect(component.expandedHistoryUuid()).toBe(second);
    expect(previewRequests[0]!.response$.observed).toBe(false);
    expect(previewRequests[1]?.uuid).toBe(second);

    const rows = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '[data-testid="person-import-history-item"]',
      ),
    ) as HTMLElement[];

    expect(rows[0]!.classList.contains("bg-blue-50")).toBe(false);
    expect(rows[1]!.classList.contains("bg-blue-50")).toBe(true);
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
  it("recupera un lote existente mediante su UUID sin cargar otro archivo", () => {
    const uuid = "01900000-0000-7000-8000-000000000098";

    consultHistoricalBatch(uuid);

    expect(previewRequests).toHaveLength(1);
    expect(previewRequests[0]?.uuid).toBe(uuid);
    expect(previewRequests[0]?.page).toBe(1);
    expect(uploadedFiles).toHaveLength(0);
  });

  it("muestra el resumen y la vista previa del lote recuperado", () => {
    const uuid = "01900000-0000-7000-8000-000000000098";

    consultHistoricalBatch(uuid);

    previewRequests[0]!.response$.next({
      ...previewResponse(),
      data: {
        ...previewResponse().data,
        uuid,
        original_filename: "personas-recuperadas.xlsx",
      },
    });
    previewRequests[0]!.response$.complete();

    fixture.detectChanges();

    expect(
      elementByTestId(fixture, "person-import-summary").textContent,
    ).toContain("personas-recuperadas.xlsx");

    expect(
      elementByTestId(fixture, "person-import-preview").textContent,
    ).toContain("MARIA");

    expect(uploadedFiles).toHaveLength(0);
  });

  it("informa cuando no se puede recuperar un lote", () => {
    consultHistoricalBatch("01900000-0000-7000-8000-000000000099");

    previewRequests[0]!.response$.error(
      new Error("Lote no encontrado"),
    );

    fixture.detectChanges();

    expect(
      elementByTestId(fixture, "person-import-recovery-error").textContent,
    ).toContain("No se pudo recuperar");

    expect(uploadedFiles).toHaveLength(0);
  });

  it("descarta una recuperación anterior al seleccionar otro XLSX", () => {
    const uuid = "01900000-0000-7000-8000-000000000098";

    consultHistoricalBatch(uuid);

    expect(previewRequests).toHaveLength(1);
    expect(previewRequests[0]!.response$.observed).toBe(true);

    selectFile(new File(["nuevo"], "otro-lote.xlsx"));

    expect(previewRequests[0]!.response$.observed).toBe(false);

    previewRequests[0]!.response$.next({
      ...previewResponse(),
      data: {
        ...previewResponse().data,
        uuid,
      },
    });

    previewRequests[0]!.response$.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="person-import-summary"]'),
    ).toBeNull();

    expect(
      element.querySelector('[data-testid="person-import-preview"]'),
    ).toBeNull();

    expect(
      elementByTestId(
        fixture,
        "person-import-selected-file",
      ).textContent,
    ).toContain("otro-lote.xlsx");
  });

  it("abre la confirmación para un lote READY con filas válidas", () => {
    uploadReadyBatch();

    fixture.detectChanges();

    buttonByTestId("person-import-open-confirmation").click();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="person-import-confirmation-form"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-testid="persona-import-password"]'),
    ).not.toBeNull();
  });

  it("no permite confirmar lotes QUEUED o sin filas válidas", () => {
    uploadReadyBatch();

    previewRequests[0]!.response$.next({
      ...previewResponse(),
      data: {
        ...previewResponse().data,
        status: "QUEUED",
      },
    });
    previewRequests[0]!.response$.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="person-import-open-confirmation"]',
      ),
    ).toBeNull();

    expect(confirmationRequests).toHaveLength(0);
  });

  it("exige una contraseña antes de solicitar la confirmación", () => {
    uploadReadyBatch();

    fixture.detectChanges();
    buttonByTestId("person-import-open-confirmation").click();
    fixture.detectChanges();

    const form = elementByTestId(
      fixture,
      "person-import-confirmation-form",
    );

    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(confirmationRequests).toHaveLength(0);

    expect(
      elementByTestId(
        fixture,
        "persona-import-password-error",
      ).textContent,
    ).toContain("La contraseña es obligatoria.");
  });

  it("envía el UUID y contraseña una sola vez mientras confirma", () => {
    uploadReadyBatch();

    fixture.detectChanges();
    buttonByTestId("person-import-open-confirmation").click();
    fixture.detectChanges();

    const password = elementByTestId(
      fixture,
      "persona-import-password",
    ) as HTMLInputElement;

    password.value = "clave-de-prueba";
    password.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();

    const form = elementByTestId(
      fixture,
      "person-import-confirmation-form",
    );

    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(confirmationRequests).toEqual([
      {
        uuid: "lote-preview",
        password: "clave-de-prueba",
      },
    ]);

    fixture.detectChanges();

    expect(
      buttonByTestId("person-import-confirm-submit").disabled,
    ).toBe(true);
  });

  it("actualiza el estado QUEUED sin anunciar el procesamiento completo", () => {
    uploadReadyBatch();

    fixture.detectChanges();
    buttonByTestId("person-import-open-confirmation").click();
    fixture.detectChanges();

    const password = elementByTestId(
      fixture,
      "persona-import-password",
    ) as HTMLInputElement;

    password.value = "clave-de-prueba";
    password.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();

    elementByTestId(
      fixture,
      "person-import-confirmation-form",
    ).dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    confirmationResponse$.next({
      data: {
        ...previewResponse().data,
        status: "QUEUED",
        confirmed_at: "2026-10-22T12:00:00.000Z",
      },
    });
    confirmationResponse$.complete();
    fixture.detectChanges();

    expect(
      elementByTestId(fixture, "person-import-summary").textContent,
    ).toContain("QUEUED");

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="person-import-confirmation-form"]',
      ),
    ).toBeNull();

    expect(
      elementByTestId(
        fixture,
        "person-import-confirmation-success",
      ).textContent,
    ).toContain("cola");

    expect(
      elementByTestId(
        fixture,
        "person-import-confirmation-success",
      ).textContent,
    ).not.toContain("completada");
  });

  it("presenta los errores de reautenticación junto a la contraseña", () => {
    uploadReadyBatch();

    fixture.detectChanges();
    buttonByTestId("person-import-open-confirmation").click();
    fixture.detectChanges();

    const password = elementByTestId(
      fixture,
      "persona-import-password",
    ) as HTMLInputElement;

    password.value = "incorrecta";
    password.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();

    elementByTestId(
      fixture,
      "person-import-confirmation-form",
    ).dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    confirmationResponse$.error(
      new PersonImportConfirmationError(
        "reauthentication",
        { status: 422 },
      ),
    );
    fixture.detectChanges();

    expect(
      elementByTestId(
        fixture,
        "persona-import-password-error",
      ).textContent,
    ).toContain("contraseña");

    expect(
      elementByTestId(
        fixture,
        "persona-import-password",
      ) as HTMLInputElement,
    ).toHaveProperty("value", "");
  });

  it("cierra la confirmación al seleccionar otro XLSX y limpia la contraseña", () => {
    uploadReadyBatch();
    fixture.detectChanges();

    buttonByTestId("person-import-open-confirmation").click();
    fixture.detectChanges();

    const password = elementByTestId(
      fixture,
      "persona-import-password",
    ) as HTMLInputElement;

    password.value = "clave-anterior";
    password.dispatchEvent(new Event("input", { bubbles: true }));

    selectFile(new File(["nuevo"], "otro-lote.xlsx"));
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="person-import-confirmation-form"]',
      ),
    ).toBeNull();

    expect(fixture.componentInstance.confirmationForm.controls.password.value)
      .toBe("");

    expect(confirmationRequests).toHaveLength(0);
  });

  it("cierra la confirmación al recuperar otro lote y limpia la contraseña", () => {
    uploadReadyBatch();

    previewRequests[0]!.response$.next(previewResponse());
    previewRequests[0]!.response$.complete();

    fixture.detectChanges();

    buttonByTestId("person-import-open-confirmation").click();
    fixture.detectChanges();

    const password = elementByTestId(
      fixture,
      "persona-import-password",
    ) as HTMLInputElement;

    password.value = "clave-anterior";
    password.dispatchEvent(new Event("input", { bubbles: true }));

    consultHistoricalBatch("01900000-0000-7000-8000-000000000098");
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="person-import-confirmation-form"]',
      ),
    ).toBeNull();

    expect(fixture.componentInstance.confirmationForm.controls.password.value)
      .toBe("");

    expect(previewRequests.at(-1)?.uuid)
      .toBe("01900000-0000-7000-8000-000000000098");
  });

  it("bloquea cambios de lote mientras una confirmación está pendiente", () => {
    uploadReadyBatch();
    fixture.detectChanges();

    buttonByTestId("person-import-open-confirmation").click();
    fixture.detectChanges();

    const password = elementByTestId(
      fixture,
      "persona-import-password",
    ) as HTMLInputElement;

    password.value = "clave-de-prueba";
    password.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();

    elementByTestId(
      fixture,
      "person-import-confirmation-form",
    ).dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(confirmationRequests).toHaveLength(1);

    const previousBatch = fixture.componentInstance.batch();
    const previousPreviewCount = previewRequests.length;

    selectFile(new File(["nuevo"], "otro-lote.xlsx"));

    fixture.componentInstance.recoveryUuid.set(
      "01900000-0000-7000-8000-000000000098",
    );
    fixture.componentInstance.recoverBatch();

    expect(fixture.componentInstance.batch()).toEqual(previousBatch);
    expect(previewRequests).toHaveLength(previousPreviewCount);
    expect(fixture.componentInstance.isConfirming()).toBe(true);
    expect(confirmationRequests).toHaveLength(1);
  });

  it("no permite confirmar un lote READY sin filas válidas", () => {
    uploadReadyBatch();

    previewRequests[0]!.response$.next({
      ...previewResponse(),
      data: {
        ...previewResponse().data,
        status: "READY",
        valid_rows: 0,
        invalid_rows: 52,
      },
    });
    previewRequests[0]!.response$.complete();

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="person-import-open-confirmation"]',
      ),
    ).toBeNull();

    expect(confirmationRequests).toHaveLength(0);
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
  function consultHistoricalBatch(uuid: string): void {
    const component = fixture.componentInstance;

    component.history.set({
      data: [
        {
          ...previewResponse().data,
          uuid,
          original_filename: "personas-historial.xlsx",
          created_at: "2026-10-22T18:00:00.000Z",
        },
      ],
      meta: {
        current_page: 1,
        per_page: 15,
        last_page: 1,
        total: 1,
      },
    });

    fixture.detectChanges();

    buttonByTestId("person-import-history-consult").click();

    fixture.detectChanges();
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