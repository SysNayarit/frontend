import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
} from '@angular/forms';

import { PersonListItem } from '../../../person.models';
import { PersonasManagementTemplateComponent } from './personas-management-template.component';

describe('PersonasManagementTemplateComponent', () => {
  let fixture: ComponentFixture<PersonasManagementTemplateComponent>;

  const person: PersonListItem = {
    id_persona:
      '0199b329-7600-7000-8000-000000000001',
    num_expediente: '2026-00000001',
    nombres: 'MARIA ELENA',
    apellido_paterno: 'LOPEZ',
    apellido_materno: 'GARCIA',
    estatus: 'ACTIVO',
  };

  const createPersonForm = () =>
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

  const createPasswordForm = () =>
    new FormGroup({
      password: new FormControl('', {
        nonNullable: true,
      }),
    });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PersonasManagementTemplateComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      PersonasManagementTemplateComponent,
    );

    fixture.componentRef.setInput(
      'registerForm',
      createPersonForm(),
    );

    fixture.componentRef.setInput(
      'editForm',
      createPersonForm(),
    );

    fixture.componentRef.setInput(
      'withdrawForm',
      createPasswordForm(),
    );

    fixture.componentRef.setInput(
      'reinstateForm',
      createPasswordForm(),
    );
  });

  it('muestra la estructura institucional de gestion de personas', () => {
    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'Plataforma Integral',
    );

    expect(element.textContent).toContain(
      'Gestión de personas',
    );

    expect(element.textContent).toContain(
      'Núcleo de identidad de SIGA',
    );
  });

  it('muestra y propaga la accion de registrar cuando esta permitida', () => {
    fixture.componentRef.setInput(
      'canCreatePerson',
      true,
    );

    let emitted = false;

    fixture.componentInstance.openRegisterRequested.subscribe(
      () => {
        emitted = true;
      },
    );

    fixture.detectChanges();

    const button =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-register"]',
      ) as HTMLButtonElement;

    expect(button).not.toBeNull();

    button.click();

    expect(emitted).toBe(true);
  });

  it('muestra los mensajes de exito recibidos', () => {
    fixture.componentRef.setInput(
      'registerSuccessMessage',
      'Persona registrada correctamente',
    );

    fixture.componentRef.setInput(
      'editSuccessMessage',
      'Persona actualizada correctamente',
    );

    fixture.componentRef.setInput(
      'withdrawSuccessMessage',
      'Persona dada de baja correctamente',
    );

    fixture.componentRef.setInput(
      'reinstateSuccessMessage',
      'Persona reingresada correctamente',
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="persona-register-success"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-edit-success"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-withdraw-success"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-reinstate-success"]',
      ),
    ).not.toBeNull();
  });

  it('compone y propaga el formulario de registro', () => {
    fixture.componentRef.setInput(
      'registerFormOpen',
      true,
    );

    let emitted = false;

    fixture.componentInstance.submitRegisterRequested.subscribe(
      () => {
        emitted = true;
      },
    );

    fixture.detectChanges();

    const form =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-register-form"]',
      ) as HTMLFormElement;

    expect(form).not.toBeNull();

    form.dispatchEvent(
      new Event('submit'),
    );

    expect(emitted).toBe(true);
  });

  it('propaga las acciones del listado de personas', () => {
    fixture.componentRef.setInput(
      'persons',
      [person],
    );

    let emittedId: string | undefined;

    fixture.componentInstance.viewDetailRequested.subscribe(
      (idPersona) => {
        emittedId = idPersona;
      },
    );

    fixture.detectChanges();

    const button =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-view-detail"]',
      ) as HTMLButtonElement;

    button.click();

    expect(emittedId).toBe(
      person.id_persona,
    );
  });
});