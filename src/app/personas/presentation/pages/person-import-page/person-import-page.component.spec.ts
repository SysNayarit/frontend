import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { PersonImportPageComponent } from "./person-import-page.component";

describe("PersonImportPageComponent", () => {
  let fixture: ComponentFixture<PersonImportPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonImportPageComponent],
      providers: [provideRouter([])],
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
    const navigation = elementByTestId(fixture, "module-navigation-current");

    expect(navigation.textContent).toContain("Importación de personas");
  });
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
