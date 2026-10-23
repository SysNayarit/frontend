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

  it('muestra el origen masivo y su archivo de procedencia', () => {
    fixture.componentRef.setInput('person', {
      ...person,
      informacion_registro: {
        fecha_registro: '2026-10-22T12:00:00.000Z',
        forma_registro: 'MASIVO',
        registrado_por: 'USUARIO IMPORTADOR',
        archivo_origen: 'personal_octubre.xlsx',
        fila_archivo: 25,
        lote_uuid: 'lote-prueba-001',
      },
    });

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const section = element.querySelector(
      '[data-testid="persona-registration-info"]',
    ) as HTMLElement;

    expect(section.textContent).toContain('Masivo');
    expect(section.textContent).toContain('USUARIO IMPORTADOR');
    expect(section.textContent).toContain('personal_octubre.xlsx');
    expect(section.textContent).toContain('25');
    expect(section.textContent).toContain('lote-prueba-001');
  });

  it('muestra el origen individual sin campos de importacion', () => {
    fixture.componentRef.setInput('person', {
      ...person,
      informacion_registro: {
        fecha_registro: '2026-10-22T12:00:00.000Z',
        forma_registro: 'INDIVIDUAL',
        registrado_por: 'USUARIO CAPTURISTA',
        archivo_origen: null,
        fila_archivo: null,
        lote_uuid: null,
      },
    });

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="registration-origin"]')
        ?.textContent,
    ).toContain('Individual');

    expect(
      element.querySelector('[data-testid="registration-user"]')
        ?.textContent,
    ).toContain('USUARIO CAPTURISTA');

    expect(
      element.querySelector('[data-testid="registration-file"]'),
    ).toBeNull();

    expect(
      element.querySelector('[data-testid="registration-row"]'),
    ).toBeNull();

    expect(
      element.querySelector('[data-testid="registration-batch"]'),
    ).toBeNull();
  });

  it('explica cuando no se puede determinar el origen', () => {
    fixture.componentRef.setInput('person', {
      ...person,
      informacion_registro: {
        fecha_registro: '2026-10-22T12:00:00.000Z',
        forma_registro: 'NO_DETERMINADO',
        registrado_por: null,
        archivo_origen: null,
        fila_archivo: null,
        lote_uuid: null,
      },
    });

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="registration-origin"]')
        ?.textContent,
    ).toContain('No determinado');

    expect(
      element.querySelector('[data-testid="registration-unknown"]'),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-testid="registration-file"]'),
    ).toBeNull();
  });

  it('tolera respuestas que no incluyen procedencia', () => {
    fixture.componentRef.setInput('person', person);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="registration-unavailable"]'),
    ).not.toBeNull();
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