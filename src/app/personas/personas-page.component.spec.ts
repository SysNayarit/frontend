import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  of,
  throwError,
} from 'rxjs';

import {
  PersonListResponse,
} from './person.models';
import { PersonService } from './person.service';
import {
  PersonasPageComponent,
} from './personas-page.component';

class PersonServiceStub {
  listCalls: number[] = [];

  shouldFail = false;

  response: PersonListResponse = {
    data: [
      {
        id_persona:
          '0199b329-7600-7000-8000-000000000001',
        num_expediente: '2026-00000001',
        nombres: 'MARIA ELENA',
        apellido_paterno: 'LOPEZ',
        apellido_materno: 'GARCIA',
        estatus: 'ACTIVO',
      },
    ],
    meta: {
      current_page: 1,
      per_page: 20,
      last_page: 1,
      total: 1,
    },
  };

  list(
    page = 1,
  ) {
    this.listCalls.push(page);

    if (this.shouldFail) {
      return throwError(
        () => new Error(
          'No fue posible obtener Personas.',
        ),
      );
    }

    return of(this.response);
  }
}

describe('PersonasPageComponent', () => {
  let service: PersonServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PersonasPageComponent,
      ],
      providers: [
        {
          provide: PersonService,
          useClass: PersonServiceStub,
        },
      ],
    }).compileComponents();

    service = TestBed.inject(
      PersonService,
    ) as unknown as PersonServiceStub;
  });

  function createFixture(): ComponentFixture<PersonasPageComponent> {
    const fixture = TestBed.createComponent(
      PersonasPageComponent,
    );

    fixture.detectChanges();

    return fixture;
  }

  it('carga y muestra la primera pagina de personas', () => {
    const fixture = createFixture();

    expect(
      service.listCalls,
    ).toEqual([
      1,
    ]);

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.textContent,
    ).toContain('2026-00000001');

    expect(
      element.textContent,
    ).toContain(
      'MARIA ELENA LOPEZ GARCIA',
    );

    expect(
      element.textContent,
    ).toContain('ACTIVO');
  });

  it('solicita la pagina siguiente cuando existe', () => {
    service.response = {
      data: [],
      meta: {
        current_page: 1,
        per_page: 20,
        last_page: 2,
        total: 21,
      },
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const nextButton = element.querySelector(
      '[data-testid="personas-next-page"]',
    ) as HTMLButtonElement;

    expect(nextButton).not.toBeNull();

    nextButton.click();

    expect(
      service.listCalls,
    ).toEqual([
      1,
      2,
    ]);
  });

  it('solicita la pagina anterior cuando existe', () => {
    service.response = {
      data: [],
      meta: {
        current_page: 2,
        per_page: 20,
        last_page: 2,
        total: 21,
      },
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const previousButton = element.querySelector(
      '[data-testid="personas-previous-page"]',
    ) as HTMLButtonElement;

    expect(previousButton).not.toBeNull();

    previousButton.click();

    expect(
      service.listCalls,
    ).toEqual([
      1,
      1,
    ]);
  });

  it('muestra un estado vacio cuando no existen personas', () => {
    service.response = {
      data: [],
      meta: {
        current_page: 1,
        per_page: 20,
        last_page: 1,
        total: 0,
      },
    };

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const emptyState = element.querySelector(
      '[data-testid="personas-empty-state"]',
    );

    expect(emptyState).not.toBeNull();

    expect(
      emptyState?.textContent,
    ).toContain(
      'No hay personas registradas',
    );
  });

  it('muestra un error cuando no puede cargar el listado', () => {
    service.shouldFail = true;

    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    const errorState = element.querySelector(
      '[data-testid="personas-error-state"]',
    );

    expect(errorState).not.toBeNull();

    expect(
      errorState?.textContent,
    ).toContain(
      'No fue posible cargar el listado de personas',
    );

    expect(
      element.querySelector(
        '[data-testid="personas-empty-state"]',
      ),
    ).toBeNull();
  });
});
