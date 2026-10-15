import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { PersonStatusBadgeComponent } from './person-status-badge.component';

describe('PersonStatusBadgeComponent', () => {
  let fixture: ComponentFixture<PersonStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PersonStatusBadgeComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      PersonStatusBadgeComponent,
    );
  });

  it('muestra el estatus recibido sin modificarlo', () => {
    fixture.componentRef.setInput(
      'status',
      'BAJA',
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('span')?.textContent,
    ).toContain('BAJA');
  });

  it('conserva la presentacion visual de la insignia de estatus', () => {
    fixture.componentRef.setInput(
      'status',
      'ACTIVO',
    );

    fixture.detectChanges();

    const badge =
      fixture.nativeElement.querySelector(
        'span',
      ) as HTMLSpanElement;

    expect(
      badge.className,
    ).toBe(
      'rounded-full border border-[#a57f2c]/30 bg-white px-3 py-1 text-sm font-semibold text-[#611232]',
    );
  });
});