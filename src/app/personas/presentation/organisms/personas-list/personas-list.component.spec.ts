import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import {
  PersonListItem,
  PersonListMeta,
} from '../../../person.models';
import { PersonasListComponent } from './personas-list.component';

describe('PersonasListComponent', () => {
  let fixture: ComponentFixture<PersonasListComponent>;

  const person: PersonListItem = {
    id_persona:
      '0199b329-7600-7000-8000-000000000001',
    num_expediente: '2026-00000001',
    nombres: 'MARIA ELENA',
    apellido_paterno: 'LOPEZ',
    apellido_materno: 'GARCIA',
    estatus: 'ACTIVO',
  };

  const meta: PersonListMeta = {
    current_page: 1,
    per_page: 15,
    last_page: 2,
    total: 20,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PersonasListComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      PersonasListComponent,
    );
  });

  it('muestra el estado de error del listado', () => {
    fixture.componentRef.setInput(
      'errorMessage',
      'error',
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="personas-error-state"]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-testid="person-list"]',
      ),
    ).toBeNull();
  });

  it('muestra el estado vacio cuando no existen personas', () => {
    fixture.componentRef.setInput(
      'persons',
      [],
    );

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="personas-empty-state"]',
      ),
    ).not.toBeNull();
  });

  it('muestra las personas recibidas sin cambiar su contenido', () => {
    fixture.componentRef.setInput(
      'persons',
      [person],
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    const list = element.querySelector(
      '[data-testid="person-list"]',
    );

    expect(list).not.toBeNull();

    expect(
      list?.textContent,
    ).toContain(
      '2026-00000001',
    );

    expect(
      list?.textContent,
    ).toContain(
      'MARIA ELENA LOPEZ GARCIA',
    );

    expect(
      list?.textContent,
    ).toContain(
      'ACTIVO',
    );
  });

  it('propaga la solicitud de consultar detalle', () => {
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

  it('propaga las solicitudes de paginacion', () => {
    fixture.componentRef.setInput(
      'persons',
      [person],
    );

    fixture.componentRef.setInput(
      'meta',
      meta,
    );

    let previousEmitted = false;
    let nextEmitted = false;

    fixture.componentInstance.previousPageRequested.subscribe(
      () => {
        previousEmitted = true;
      },
    );

    fixture.componentInstance.nextPageRequested.subscribe(
      () => {
        nextEmitted = true;
      },
    );

    fixture.detectChanges();

    const next =
      fixture.nativeElement.querySelector(
        '[data-testid="personas-next-page"]',
      ) as HTMLButtonElement;

    next.click();

    expect(nextEmitted).toBe(true);

    fixture.componentRef.setInput(
      'meta',
      {
        ...meta,
        current_page: 2,
      },
    );

    fixture.detectChanges();

    const previous =
      fixture.nativeElement.querySelector(
        '[data-testid="personas-previous-page"]',
      ) as HTMLButtonElement;

    previous.click();

    expect(previousEmitted).toBe(true);
  });
});