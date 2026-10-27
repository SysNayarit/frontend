import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { MainNavigationComponent } from "./main-navigation.component";

describe("MainNavigationComponent", () => {
  let fixture: ComponentFixture<MainNavigationComponent>;
  let component: MainNavigationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainNavigationComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MainNavigationComponent);
    component = fixture.componentInstance;
  });

  it("muestra Usuarios cuando existe usuarios.ver", () => {
    component.permissions = ["usuarios.ver"];
    fixture.detectChanges();

    const link: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector(
        '[data-testid="users-navigation"]',
      );

    expect(link).not.toBeNull();
    expect(link?.textContent).toContain("Usuarios");
  });

  it("oculta Usuarios cuando falta usuarios.ver", () => {
    component.permissions = ["personas.ver"];
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector(
      '[data-testid="users-navigation"]',
    );

    expect(link).toBeNull();
  });

  it("dirige la opcion Usuarios a la ruta administrativa", () => {
    component.permissions = ["usuarios.ver"];
    fixture.detectChanges();

    const link: HTMLAnchorElement =
      fixture.nativeElement.querySelector(
        '[data-testid="users-navigation"]',
      );

    expect(link.getAttribute("href")).toBe("/usuarios");
  });

  it("mantiene Personas independiente de usuarios.ver", () => {
    component.permissions = ["personas.ver"];
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="personas-navigation"]',
      ),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="users-navigation"]',
      ),
    ).toBeNull();
  });
});