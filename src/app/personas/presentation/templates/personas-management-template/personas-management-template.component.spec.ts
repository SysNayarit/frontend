import { Component } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PersonasManagementTemplateComponent } from './personas-management-template.component';

@Component({
  standalone: true,
  imports: [
    PersonasManagementTemplateComponent,
  ],
  template: `
    <app-personas-management-template>
      <button
        type="button"
        data-testid="projected-action"
        (click)="clickCount += 1"
      >
        Acción proyectada
      </button>
    </app-personas-management-template>
  `,
})
class PersonasManagementTemplateHostComponent {
  clickCount = 0;
}

describe('PersonasManagementTemplateComponent', () => {
  let fixture: ComponentFixture<PersonasManagementTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PersonasManagementTemplateComponent,
        PersonasManagementTemplateHostComponent,
      ],
      providers: [
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      PersonasManagementTemplateComponent,
    );
  });

  it('muestra la estructura institucional de gestion de personas', () => {
    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'Módulo Personas',
    );

    expect(element.textContent).toContain(
      'Gestión de personas',
    );

    expect(element.textContent).toContain(
      'Núcleo de identidad de SIGA',
    );
  });

  it('conserva la navegacion estructural del modulo', () => {
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        'app-module-navigation',
      ),
    ).not.toBeNull();
  });

  it('proyecta el contenido funcional de la pagina', () => {
    const host = TestBed.createComponent(
      PersonasManagementTemplateHostComponent,
    );

    host.detectChanges();

    expect(
      host.nativeElement.querySelector(
        '[data-testid="projected-action"]',
      ),
    ).not.toBeNull();
  });

  it('no expone estado ni eventos funcionales de Personas', () => {
    const component =
      fixture.componentInstance as unknown as Record<string, unknown>;

    expect('persons' in component).toBe(false);
    expect('registerForm' in component).toBe(false);
    expect('openRegisterRequested' in component).toBe(false);
    expect('viewDetailRequested' in component).toBe(false);
  });

  it('no interfiere con las acciones del contenido proyectado', () => {
    const host = TestBed.createComponent(
      PersonasManagementTemplateHostComponent,
    );

    host.detectChanges();

    const button =
      host.nativeElement.querySelector(
        '[data-testid="projected-action"]',
      ) as HTMLButtonElement;

    button.click();

    expect(
      host.componentInstance.clickCount,
    ).toBe(1);
  });
});
