import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
} from '@angular/forms';

import { PersonaRegisterFormComponent } from './persona-register-form.component';

describe('PersonaRegisterFormComponent', () => {
  let fixture: ComponentFixture<PersonaRegisterFormComponent>;

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
        PersonaRegisterFormComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      PersonaRegisterFormComponent,
    );

    fixture.componentRef.setInput(
      'form',
      createForm(),
    );
  });

  it('muestra los campos actuales de registro', () => {
    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="persona-nombres"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-apellido-paterno"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-apellido-materno"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-fecha-nacimiento"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-sexo"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-estado-civil"]',
      ),
    ).not.toBeNull();
  });

  it('mantiene el formulario recibido como fuente de los controles', () => {
    const form = createForm();

    form.controls.nombres.setValue(
      'MARIA ELENA',
    );

    fixture.componentRef.setInput(
      'form',
      form,
    );

    fixture.detectChanges();

    const input =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-nombres"]',
      ) as HTMLInputElement;

    expect(input.value).toBe(
      'MARIA ELENA',
    );
  });

  it('muestra los mensajes de error recibidos', () => {
    fixture.componentRef.setInput(
      'errorMessage',
      'No fue posible registrar la persona.',
    );

    fixture.componentRef.setInput(
      'fechaNacimientoError',
      'Fecha no válida',
    );

    fixture.componentRef.setInput(
      'nombresError',
      'Nombres no válidos',
    );

    fixture.componentRef.setInput(
      'apellidosError',
      'Apellidos no válidos',
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="persona-register-error"]',
      )?.textContent,
    ).toContain(
      'No fue posible registrar la persona.',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-fecha-nacimiento-error"]',
      )?.textContent,
    ).toContain(
      'Fecha no válida',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-nombres-error"]',
      )?.textContent,
    ).toContain(
      'Nombres no válidos',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-apellidos-error"]',
      )?.textContent,
    ).toContain(
      'Apellidos no válidos',
    );
  });

  it('emite la solicitud de registro al enviar el formulario', () => {
    let emitted = false;

    fixture.componentInstance.submitRequested.subscribe(
      () => {
        emitted = true;
      },
    );

    fixture.detectChanges();

    const form =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-register-form"]',
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
        '[data-testid="persona-register-cancel"]',
      ) as HTMLButtonElement;

    button.click();

    expect(emitted).toBe(true);
  });
});