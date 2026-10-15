import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { ModuleNavigationComponent } from './module-navigation.component';

describe('ModuleNavigationComponent', () => {
  let fixture:
    ComponentFixture<ModuleNavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ModuleNavigationComponent,
      ],
    }).compileComponents();

    fixture =
      TestBed.createComponent(
        ModuleNavigationComponent,
      );

    fixture.componentRef.setInput(
      'currentLabel',
      'Gesti\u00f3n de personas',
    );

    fixture.detectChanges();
  });

  it('muestra la navegacion compacta del modulo con ortografia correcta', () => {
    const navigation =
      fixture.nativeElement.querySelector(
        '[data-testid="module-navigation"]',
      ) as HTMLElement;

    const text =
      navigation.textContent
        ?.replace(/\s+/g, ' ')
        .trim();

    expect(text).toBe(
      'Navegaci\u00f3n del m\u00f3dulo > Men\u00fa principal > Gesti\u00f3n de personas',
    );

    expect(text).not.toContain('?');
  });

  it('enlaza el menu principal con la ruta oficial de inicio', () => {
    const homeLink =
      fixture.nativeElement.querySelector(
        '[data-testid="module-navigation-home"]',
      ) as HTMLAnchorElement | null;

    expect(homeLink).not.toBeNull();

    expect(
      homeLink?.getAttribute('href'),
    ).toBe('/inicio');
  });
});
