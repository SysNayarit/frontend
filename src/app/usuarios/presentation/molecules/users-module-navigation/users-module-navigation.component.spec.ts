import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";

import { AuthContextService } from "../../../../auth/auth-context.service";
import { UsersModuleNavigationComponent } from "./users-module-navigation.component";

describe("UsersModuleNavigationComponent", () => {
  async function render(permissions: readonly string[]) {
    await TestBed.configureTestingModule({
      imports: [UsersModuleNavigationComponent],
      providers: [
        provideRouter([
          { path: "usuarios", children: [] },
          { path: "usuarios/registro", children: [] },
          { path: "usuarios/roles/masivo", children: [] },
          { path: "usuarios/menu", children: [] },
          { path: "inicio", children: [] },
        ]),
        {
          provide: AuthContextService,
          useValue: {
            hasPermission: (permission: string) =>
              permissions.includes(permission),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(UsersModuleNavigationComponent);

    fixture.detectChanges();

    return {
      fixture,
      router: TestBed.inject(Router),
      root: fixture.nativeElement as HTMLElement,
    };
  }

  it("resalta unicamente el submenu correspondiente a la ruta activa", async () => {
    const { fixture, router, root } = await render([
      "usuarios.ver",
      "usuarios.crear",
      "usuarios.asignar_roles",
      "roles.ver",
    ]);

    const escenarios = [
      { url: "/usuarios", active: "users-nav-list" },
      { url: "/usuarios/registro", active: "users-nav-registration" },
      { url: "/usuarios/roles/masivo", active: "users-nav-bulk" },
    ];

    for (const escenario of escenarios) {
      await router.navigateByUrl(escenario.url);
      fixture.detectChanges();

      const activos = Array.from(
        root.querySelectorAll('a[aria-current="page"]'),
      );

      expect(activos).toHaveLength(1);
      expect(activos[0].getAttribute("data-testid")).toBe(escenario.active);
    }
  });

  it("no marca un submenu al salir del modulo", async () => {
    const { fixture, router, root } = await render([
      "usuarios.ver",
      "usuarios.crear",
      "usuarios.asignar_roles",
      "roles.ver",
    ]);

    await router.navigateByUrl("/usuarios/registro");
    fixture.detectChanges();

    await router.navigateByUrl("/inicio");
    fixture.detectChanges();

    expect(root.querySelector('a[aria-current="page"]')).toBeNull();
  });

  it("oculta las operaciones sin permisos", async () => {
    const { root } = await render(["usuarios.ver"]);

    expect(root.querySelector('[data-testid="users-nav-list"]')).not.toBeNull();
    expect(
      root.querySelector('[data-testid="users-nav-registration"]'),
    ).toBeNull();
    expect(root.querySelector('[data-testid="users-nav-bulk"]')).toBeNull();
  });

  it("requiere ambos permisos para mostrar la asignacion masiva", async () => {
    const { root } = await render(["usuarios.asignar_roles"]);

    expect(root.querySelector('[data-testid="users-nav-bulk"]')).toBeNull();
  });
});
