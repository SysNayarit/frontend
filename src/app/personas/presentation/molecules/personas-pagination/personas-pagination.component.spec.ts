import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { PersonListMeta } from '../../../person.models';
import { PersonasPaginationComponent } from './personas-pagination.component';

describe('PersonasPaginationComponent', () => {
  let fixture: ComponentFixture<PersonasPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PersonasPaginationComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      PersonasPaginationComponent,
    );
  });

  it('muestra el total y la pagina actual', () => {
    fixture.componentRef.setInput(
      'meta',
      {
        current_page: 2,
        last_page: 4,
        total: 37,
      } as PersonListMeta,
    );

    fixture.detectChanges();

    const text =
      (fixture.nativeElement as HTMLElement)
        .textContent ?? '';

    expect(text).toContain(
      'Total de personas:',
    );

    expect(text).toContain('37');
    expect(text).toContain('Página');
    expect(text).toContain('2');
    expect(text).toContain('4');
  });

  it('emite la solicitud de pagina anterior', () => {
    fixture.componentRef.setInput(
      'meta',
      {
        current_page: 2,
        last_page: 4,
        total: 37,
      } as PersonListMeta,
    );

    let emitted = false;

    fixture.componentInstance.previousRequested.subscribe(
      () => {
        emitted = true;
      },
    );

    fixture.detectChanges();

    const button =
      fixture.nativeElement.querySelector(
        '[data-testid="personas-previous-page"]',
      ) as HTMLButtonElement;

    button.click();

    expect(emitted).toBe(true);
  });

  it('emite la solicitud de pagina siguiente', () => {
    fixture.componentRef.setInput(
      'meta',
      {
        current_page: 2,
        last_page: 4,
        total: 37,
      } as PersonListMeta,
    );

    let emitted = false;

    fixture.componentInstance.nextRequested.subscribe(
      () => {
        emitted = true;
      },
    );

    fixture.detectChanges();

    const button =
      fixture.nativeElement.querySelector(
        '[data-testid="personas-next-page"]',
      ) as HTMLButtonElement;

    button.click();

    expect(emitted).toBe(true);
  });

  it('deshabilita la navegacion en los limites', () => {
    fixture.componentRef.setInput(
      'meta',
      {
        current_page: 1,
        last_page: 1,
        total: 1,
      } as PersonListMeta,
    );

    fixture.detectChanges();

    const previous =
      fixture.nativeElement.querySelector(
        '[data-testid="personas-previous-page"]',
      ) as HTMLButtonElement;

    const next =
      fixture.nativeElement.querySelector(
        '[data-testid="personas-next-page"]',
      ) as HTMLButtonElement;

    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(true);
  });
});