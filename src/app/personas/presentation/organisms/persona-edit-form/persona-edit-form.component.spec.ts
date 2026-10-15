import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
} from '@angular/forms';

import { PersonaEditFormComponent } from './persona-edit-form.component';

describe('PersonaEditFormComponent', () => {
  let fixture: ComponentFixture<PersonaEditFormComponent>;

  const createForm = () =>
    new FormGroup({
      nombres: new FormControl('', {
        nonNullable: true,
      }),
      apellido_paterno: new FormControl('', {
        nonNullable: true,
      }),
      apellido_materno: new FormControl('', {
        nonNullable: true,
      }),
      fecha_nacimiento: new FormControl('', {
        nonNullable: true,
      }),
      sexo: new FormControl('', {
        nonNullable: true,
      }),
      estado_civil: new FormControl('', {
        nonNullable: true,
      }),
    });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PersonaEditFormComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      PersonaEditFormComponent,
    );

    fixture.componentRef.setInput(
      'form',
      createForm(),
    );
  });

  it('muestra los campos actuales de edicion', () => {
    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="persona-edit-nombres"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-edit-apellido-paterno"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-edit-apellido-materno"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-edit-fecha-nacimiento"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-edit-sexo"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-edit-estado-civil"]',
      ),
    ).not.toBeNull();
  });

  it('mantiene los valores precargados del formulario recibido', () => {
    const form = createForm();

    form.setValue({
      nombres: 'MARIA ELENA',
      apellido_paterno: 'LOPEZ',
      apellido_materno: 'GARCIA',
      fecha_nacimiento: '1990-05-20',
      sexo: 'FEMENINO',
      estado_civil: 'SOLTERO',
    });

    fixture.componentRef.setInput(
      'form',
      form,
    );

    fixture.detectChanges();

    const nombres =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-edit-nombres"]',
      ) as HTMLInputElement;

    const fechaNacimiento =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-edit-fecha-nacimiento"]',
      ) as HTMLInputElement;

    expect(nombres.value).toBe(
      'MARIA ELENA',
    );

    expect(fechaNacimiento.value).toBe(
      '1990-05-20',
    );
  });

  it('muestra los mensajes de error recibidos', () => {
    fixture.componentRef.setInput(
      'errorMessage',
      'No fue posible actualizar la persona.',
    );

    fixture.componentRef.setInput(
      'nombresError',
      'Nombres no válidos',
    );

    fixture.componentRef.setInput(
      'apellidosError',
      'Apellidos no válidos',
    );

    fixture.componentRef.setInput(
      'fechaNacimientoError',
      'Fecha no válida',
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="persona-edit-error"]',
      )?.textContent,
    ).toContain(
      'No fue posible actualizar la persona.',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-edit-nombres-error"]',
      )?.textContent,
    ).toContain(
      'Nombres no válidos',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-edit-apellidos-error"]',
      )?.textContent,
    ).toContain(
      'Apellidos no válidos',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-edit-fecha-nacimiento-error"]',
      )?.textContent,
    ).toContain(
      'Fecha no válida',
    );
  });

  it('emite la solicitud de actualizacion al enviar el formulario', () => {
    let emitted = false;

    fixture.componentInstance.submitRequested.subscribe(
      () => {
        emitted = true;
      },
    );

    fixture.detectChanges();

    const form =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-edit-form"]',
      ) as HTMLFormElement;

    form.dispatchEvent(
      new Event('submit'),
    );

    expect(emitted).toBe(true);
  });

  it('emite la solicitud de cancelacion', () => {
    let emitted = false;

    fixture.componentInstance.cancelRequested.subscribe(
      () => {
        emitted = true;
      },
    );

    fixture.detectChanges();

    const button =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-edit-cancel"]',
      ) as HTMLButtonElement;

    button.click();

    expect(emitted).toBe(true);
  });
});