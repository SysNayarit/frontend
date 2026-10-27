import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UsersPaginationComponent } from "./users-pagination.component";

describe("UsersPaginationComponent", () => {
  let fixture: ComponentFixture<UsersPaginationComponent>;
  let component: UsersPaginationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersPaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPaginationComponent);
    component = fixture.componentInstance;
  });

  it("muestra la pagina actual y el total de usuarios", () => {
    component.currentPage = 2;
    component.lastPage = 4;
    component.total = 73;

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="current-page"]')
        ?.textContent?.trim(),
    ).toBe("2");

    expect(
      element.querySelector('[data-testid="last-page"]')
        ?.textContent?.trim(),
    ).toBe("4");

    expect(element.textContent).toContain("73 usuarios registrados");
  });

  it("emite la pagina anterior cuando corresponde", () => {
    component.currentPage = 3;
    component.lastPage = 5;

    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="previous-page"]',
      );

    button.click();

    expect(emitted).toEqual([2]);
  });

  it("emite la pagina siguiente cuando corresponde", () => {
    component.currentPage = 2;
    component.lastPage = 5;

    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="next-page"]',
      );

    button.click();

    expect(emitted).toEqual([3]);
  });

  it("bloquea la navegacion en la primera pagina", () => {
    component.currentPage = 1;
    component.lastPage = 3;

    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="previous-page"]',
      );

    expect(button.disabled).toBe(true);

    component.previous();

    expect(emitted).toEqual([]);
  });

  it("bloquea la navegacion en la ultima pagina", () => {
    component.currentPage = 3;
    component.lastPage = 3;

    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="next-page"]',
      );

    expect(button.disabled).toBe(true);

    component.next();

    expect(emitted).toEqual([]);
  });

  it("deshabilita ambos controles durante la carga", () => {
    component.currentPage = 2;
    component.lastPage = 4;
    component.disabled = true;

    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    fixture.detectChanges();

    const previous: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="previous-page"]',
      );

    const next: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        '[data-testid="next-page"]',
      );

    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(true);

    component.previous();
    component.next();

    expect(emitted).toEqual([]);
  });
});