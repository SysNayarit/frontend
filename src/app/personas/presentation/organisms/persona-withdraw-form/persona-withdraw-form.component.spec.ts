import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { PersonListItem } from '../../../person.models';
import { createPersonReauthenticationForm } from '../../forms/person-reauthentication-form';
import { PersonaWithdrawFormComponent } from './persona-withdraw-form.component';

describe('PersonaWithdrawFormComponent', () => {
  let fixture: ComponentFixture<PersonaWithdrawFormComponent>;

  const person: PersonListItem = {
    id_persona:
      '0199b329-7600-7000-8000-000000000001',
    num_expediente: '2026-00000001',
    nombres: 'MARIA ELENA',
    apellido_paterno: 'LOPEZ',
    apellido_materno: 'GARCIA',
    estatus: 'ACTIVO',
  };

  const createForm = createPersonReauthenticationForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PersonaWithdrawFormComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      PersonaWithdrawFormComponent,
    );

    fixture.componentRef.setInput(
      'form',
      createForm(),
    );

    fixture.componentRef.setInput(
      'person',
      person,
    );
  });

  it('muestra la persona y el expediente que seran dados de baja', () => {
    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    const form = element.querySelector(
      '[data-testid="persona-withdraw-form"]',
    );

    expect(form).not.toBeNull();

    expect(form?.textContent).toContain(
      'MARIA ELENA LOPEZ GARCIA',
    );

    expect(form?.textContent).toContain(
      '2026-00000001',
    );
  });

  it('mantiene el formulario recibido como fuente de la contraseña', () => {
    const form = createForm();

    form.controls.password.setValue(
      'contraseña-temporal',
    );

    fixture.componentRef.setInput(
      'form',
      form,
    );

    fixture.detectChanges();

    const input =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-withdraw-password"]',
      ) as HTMLInputElement;

    expect(input.value).toBe(
      'contraseña-temporal',
    );
  });

  it('muestra los mensajes de error recibidos', () => {
    fixture.componentRef.setInput(
      'passwordError',
      'La contraseña no es válida.',
    );

    fixture.componentRef.setInput(
      'errorMessage',
      'Se requiere una reautenticación reciente.',
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="persona-withdraw-password-error"]',
      )?.textContent,
    ).toContain(
      'La contraseña no es válida.',
    );

    expect(
      element.querySelector(
        '[data-testid="persona-withdraw-error"]',
      )?.textContent,
    ).toContain(
      'Se requiere una reautenticación reciente.',
    );
  });

  it('emite la solicitud de baja al enviar el formulario', () => {
    let emitted = false;

    fixture.componentInstance.submitRequested.subscribe(
      () => {
        emitted = true;
      },
    );

    fixture.detectChanges();

    const form =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-withdraw-form"]',
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
        '[data-testid="persona-withdraw-cancel"]',
      ) as HTMLButtonElement;

    button.click();

    expect(emitted).toBe(true);
  });
});