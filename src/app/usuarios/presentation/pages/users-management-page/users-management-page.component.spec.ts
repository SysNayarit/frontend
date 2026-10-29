import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { UsersManagementPageComponent } from "./users-management-page.component";

describe("UsersManagementPageComponent", () => {
  it("presenta las tres operaciones del modulo", async () => {
    await TestBed.configureTestingModule({
      imports: [UsersManagementPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(UsersManagementPageComponent);

    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;

    expect(
      root.querySelector('[data-testid="menu-user-registration"]'),
    ).not.toBeNull();

    expect(
      root.querySelector('[data-testid="menu-bulk-roles"]'),
    ).not.toBeNull();

    expect(
      root.querySelector('[data-testid="menu-registered-users"]'),
    ).not.toBeNull();

    const link = root.querySelector<HTMLAnchorElement>(
      '[data-testid="menu-open-current-users"]',
    );

    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("/usuarios");
  });
});
