import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { PersonDetail } from '../../../person.models';
import { PersonaDetailComponent } from './persona-detail.component';

describe('PersonaDetailComponent', () => {
  let fixture: ComponentFixture<PersonaDetailComponent>;

  const person: PersonDetail = {
    id_persona:
      '0199b329-7600-7000-8000-000000000001',
    curp: null,
    rfc: null,
    num_expediente: '2026-00000001',
    nombres: 'MARIA ELENA',
    apellido_paterno: 'LOPEZ',
    apellido_materno: 'GARCIA',
    fecha_nacimiento: '1990-05-20T00:00:00.000000Z',
    sexo: 'femenino',
    estado_civil: 'soltero',
    correo_institucional: null,
    correo_personal: null,
    id_pais_origen: null,
    id_pais_nacimiento: null,
    id_territorio_nacimiento: null,
    fecha_alta: '2026-10-01T12:00:00.000000Z',
    fecha_baja: null,
    estatus: 'ACTIVO',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PersonaDetailComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      PersonaDetailComponent,
    );
  });

  it('muestra el estado de error del detalle', () => {
    fixture.componentRef.setInput(
      'errorMessage',
      'error',
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="persona-detail-error"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-detail"]',
      ),
    ).toBeNull();
  });

  it('muestra el detalle recibido', () => {
    fixture.componentRef.setInput(
      'person',
      person,
    );

    fixture.detectChanges();

    const detail =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-detail"]',
      ) as HTMLElement;

    expect(detail).not.toBeNull();

    expect(detail.textContent).toContain(
      'MARIA ELENA LOPEZ GARCIA',
    );

    expect(detail.textContent).toContain(
      '2026-00000001',
    );

    expect(detail.textContent).toContain(
      'femenino',
    );

    expect(detail.textContent).toContain(
      'soltero',
    );

    expect(detail.textContent).toContain(
      '20 de mayo de 1990',
    );

    expect(detail.textContent).toContain(
      'ACTIVO',
    );
  });

  it('mantiene los textos para datos opcionales no registrados', () => {
    fixture.componentRef.setInput(
      'person',
      {
        ...person,
        sexo: null,
        estado_civil: null,
        fecha_nacimiento: null,
      },
    );

    fixture.detectChanges();

    const detail =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-detail"]',
      ) as HTMLElement;

    expect(detail.textContent).toContain(
      'No registrado',
    );

    expect(detail.textContent).toContain(
      'No registrada',
    );
  });

  it('no muestra detalle ni error cuando no recibe estado', () => {
    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="persona-detail"]',
      ),
    ).toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-detail-error"]',
      ),
    ).toBeNull();
  });

  it('emite la solicitud de cierre del detalle', () => {
    fixture.componentRef.setInput(
      'person',
      person,
    );

    let emitted = false;

    fixture.componentInstance.closeRequested.subscribe(
      () => {
        emitted = true;
      },
    );

    fixture.detectChanges();

    const button =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-detail-close"]',
      ) as HTMLButtonElement;

    expect(button).not.toBeNull();

    button.click();

    expect(emitted).toBe(true);
  });
});