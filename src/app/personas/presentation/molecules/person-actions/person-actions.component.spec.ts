import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { PersonListItem } from '../../../person.models';
import { PersonActionsComponent } from './person-actions.component';

describe('PersonActionsComponent', () => {
  let fixture: ComponentFixture<PersonActionsComponent>;

  const activePerson = {
    id_persona:
      '0199b329-7600-7000-8000-000000000001',
    estatus: 'ACTIVO',
  } as PersonListItem;

  const withdrawnPerson = {
    ...activePerson,
    estatus: 'BAJA',
  } as PersonListItem;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PersonActionsComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      PersonActionsComponent,
    );
  });

  it('siempre muestra ver detalle y emite el identificador', () => {
    fixture.componentRef.setInput(
      'person',
      activePerson,
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
      activePerson.id_persona,
    );
  });

  it('muestra editar solo cuando se permite y emite el identificador', () => {
    fixture.componentRef.setInput(
      'person',
      activePerson,
    );

    fixture.componentRef.setInput(
      'canUpdate',
      true,
    );

    let emittedId: string | undefined;

    fixture.componentInstance.editRequested.subscribe(
      (idPersona) => {
        emittedId = idPersona;
      },
    );

    fixture.detectChanges();

    const button =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-edit"]',
      ) as HTMLButtonElement;

    button.click();

    expect(emittedId).toBe(
      activePerson.id_persona,
    );
  });

  it('muestra dar de baja para una persona activa cuando se permite', () => {
    fixture.componentRef.setInput(
      'person',
      activePerson,
    );

    fixture.componentRef.setInput(
      'canWithdraw',
      true,
    );

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="persona-withdraw"]',
      ),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="persona-reinstate"]',
      ),
    ).toBeNull();
  });

  it('muestra reingresar para una persona en baja cuando se permite', () => {
    fixture.componentRef.setInput(
      'person',
      withdrawnPerson,
    );

    fixture.componentRef.setInput(
      'canReinstate',
      true,
    );

    let emittedPerson:
      | PersonListItem
      | undefined;

    fixture.componentInstance.reinstateRequested.subscribe(
      (person) => {
        emittedPerson = person;
      },
    );

    fixture.detectChanges();

    const button =
      fixture.nativeElement.querySelector(
        '[data-testid="persona-reinstate"]',
      ) as HTMLButtonElement;

    button.click();

    expect(emittedPerson).toBe(
      withdrawnPerson,
    );

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="persona-withdraw"]',
      ),
    ).toBeNull();
  });

  it('oculta las acciones protegidas cuando no existen permisos', () => {
    fixture.componentRef.setInput(
      'person',
      activePerson,
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="persona-edit"]',
      ),
    ).toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-withdraw"]',
      ),
    ).toBeNull();

    expect(
      element.querySelector(
        '[data-testid="persona-reinstate"]',
      ),
    ).toBeNull();
  });
});