import { ComponentFixture, TestBed } from "@angular/core/testing";

import { Profile } from "../../../profile.models";
import { ProfileSelectorComponent } from "./profile-selector.component";

describe("ProfileSelectorComponent", () => {
  let fixture: ComponentFixture<ProfileSelectorComponent>;

  const profiles: Profile[] = [
    {
      id: 1,
      name: "Personas",
      code: "PERFIL_PERSONAS",
      is_default: true,
      group: {
        id: 1,
        name: "Operación",
        code: "GRUPO_OPERACION",
        sort_order: 10,
      },
    },
    {
      id: 2,
      name: "Auditoria",
      code: "PERFIL_AUDITORIA",
      is_default: false,
      group: {
        id: 2,
        name: "Control y supervisión",
        code: "GRUPO_CONTROL_SUPERVISION",
        sort_order: 20,
      },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSelectorComponent);
  });

  it("muestra los perfiles asignados y selecciona el predeterminado", () => {
    fixture.componentRef.setInput("profiles", profiles);

    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement | null;

    expect(select).not.toBeNull();

    const options = Array.from(select?.options ?? []);

    expect(options).toHaveLength(2);

    expect(options.map((option) => option.textContent?.trim())).toEqual([
      "Personas",
      "Auditoria",
    ]);

    expect(select?.value).toBe("1");
  });
  it("emite el identificador del perfil seleccionado", () => {
    fixture.componentRef.setInput("profiles", profiles);

    let emittedProfileId: number | undefined;

    fixture.componentInstance.profileSelected.subscribe((profileId) => {
      emittedProfileId = profileId;
    });

    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement;

    select.value = "2";

    select.dispatchEvent(new Event("change"));

    expect(emittedProfileId).toBe(2);
  });
  it("muestra un estado informativo cuando no existen perfiles asignados", () => {
    fixture.componentRef.setInput("profiles", []);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="profile-selector"]'),
    ).toBeNull();

    const emptyState = element.querySelector(
      '[data-testid="profiles-empty-state"]',
    );

    expect(emptyState).not.toBeNull();

    expect(emptyState?.textContent).toContain("No tienes perfiles asignados");
  });
  it("deshabilita el selector cuando el cambio esta en proceso", () => {
    fixture.componentRef.setInput("profiles", profiles);

    fixture.componentRef.setInput("disabled", true);

    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement;

    expect(select.disabled).toBe(true);
  });

  it("agrupa los perfiles por grupo y respeta el orden configurado", () => {
    const groupedProfiles: Profile[] = [
      {
        id: 3,
        name: "Administración",
        code: "PERFIL_ADMINISTRACION",
        is_default: false,
        group: {
          id: 3,
          name: "Administración",
          code: "GRUPO_ADMINISTRACION",
          sort_order: 30,
        },
      },
      {
        id: 2,
        name: "Auditoria",
        code: "PERFIL_AUDITORIA",
        is_default: false,
        group: {
          id: 2,
          name: "Control y supervisión",
          code: "GRUPO_CONTROL_SUPERVISION",
          sort_order: 20,
        },
      },
      {
        id: 1,
        name: "Personas",
        code: "PERFIL_PERSONAS",
        is_default: true,
        group: {
          id: 1,
          name: "Operación",
          code: "GRUPO_OPERACION",
          sort_order: 10,
        },
      },
      {
        id: 4,
        name: "Trámites",
        code: "PERFIL_TRAMITES",
        is_default: false,
        group: {
          id: 1,
          name: "Operación",
          code: "GRUPO_OPERACION",
          sort_order: 10,
        },
      },
    ];

    fixture.componentRef.setInput("profiles", groupedProfiles);

    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement;

    const groups = Array.from(select.querySelectorAll("optgroup"));

    expect(groups).toHaveLength(3);

    expect(groups.map((group) => group.label)).toEqual([
      "Operación",
      "Control y supervisión",
      "Administración",
    ]);

    expect(
      groups.map((group) =>
        Array.from(group.querySelectorAll("option")).map((option) =>
          option.textContent?.trim(),
        ),
      ),
    ).toEqual([["Personas", "Trámites"], ["Auditoria"], ["Administración"]]);

    expect(select.value).toBe("1");
  });

  it("filtra perfiles por nombre y conserva su grupo", () => {
    const searchableProfiles: Profile[] = [
      {
        id: 1,
        name: "Personas",
        code: "PERFIL_PERSONAS",
        is_default: true,
        group: {
          id: 1,
          name: "Operación",
          code: "GRUPO_OPERACION",
          sort_order: 10,
        },
      },
      {
        id: 4,
        name: "Trámites",
        code: "PERFIL_TRAMITES",
        is_default: false,
        group: {
          id: 1,
          name: "Operación",
          code: "GRUPO_OPERACION",
          sort_order: 10,
        },
      },
      {
        id: 2,
        name: "Auditoria",
        code: "PERFIL_AUDITORIA",
        is_default: false,
        group: {
          id: 2,
          name: "Control y supervisión",
          code: "GRUPO_CONTROL_SUPERVISION",
          sort_order: 20,
        },
      },
    ];

    fixture.componentRef.setInput("profiles", searchableProfiles);

    fixture.detectChanges();

    const search = fixture.nativeElement.querySelector(
      '[data-testid="profile-search"]',
    ) as HTMLInputElement | null;

    expect(search).not.toBeNull();

    if (!search) {
      return;
    }

    search.value = "tramites";
    search.dispatchEvent(new Event("input"));

    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement;

    const groups = Array.from(select.querySelectorAll("optgroup"));

    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe("Operación");

    expect(
      Array.from(groups[0]?.querySelectorAll("option") ?? []).map((option) =>
        option.textContent?.trim(),
      ),
    ).toEqual(["Trámites"]);
  });

  it("buscar por nombre de grupo muestra todos sus perfiles", () => {
    const searchableProfiles: Profile[] = [
      {
        id: 1,
        name: "Personas",
        code: "PERFIL_PERSONAS",
        is_default: true,
        group: {
          id: 1,
          name: "Operación",
          code: "GRUPO_OPERACION",
          sort_order: 10,
        },
      },
      {
        id: 4,
        name: "Trámites",
        code: "PERFIL_TRAMITES",
        is_default: false,
        group: {
          id: 1,
          name: "Operación",
          code: "GRUPO_OPERACION",
          sort_order: 10,
        },
      },
      {
        id: 2,
        name: "Auditoria",
        code: "PERFIL_AUDITORIA",
        is_default: false,
        group: {
          id: 2,
          name: "Control y supervisión",
          code: "GRUPO_CONTROL_SUPERVISION",
          sort_order: 20,
        },
      },
    ];

    fixture.componentRef.setInput("profiles", searchableProfiles);

    fixture.detectChanges();

    const search = fixture.nativeElement.querySelector(
      '[data-testid="profile-search"]',
    ) as HTMLInputElement | null;

    expect(search).not.toBeNull();

    if (!search) {
      return;
    }

    search.value = "operacion";
    search.dispatchEvent(new Event("input"));

    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement;

    const groups = Array.from(select.querySelectorAll("optgroup"));

    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe("Operación");

    expect(
      Array.from(groups[0]?.querySelectorAll("option") ?? []).map((option) =>
        option.textContent?.trim(),
      ),
    ).toEqual(["Personas", "Trámites"]);
  });

  it("muestra un estado informativo cuando la busqueda no tiene coincidencias", () => {
    fixture.componentRef.setInput("profiles", profiles);

    fixture.detectChanges();

    const search = fixture.nativeElement.querySelector(
      '[data-testid="profile-search"]',
    ) as HTMLInputElement;

    search.value = "perfil inexistente";
    search.dispatchEvent(new Event("input"));

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="profile-selector"]'),
    ).toBeNull();

    const emptyState = element.querySelector(
      '[data-testid="profile-search-empty-state"]',
    );

    expect(emptyState).not.toBeNull();

    expect(emptyState?.textContent).toContain("No se encontraron perfiles");
  });

  it("deshabilita tambien la busqueda cuando el cambio esta en proceso", () => {
    fixture.componentRef.setInput("profiles", profiles);
    fixture.componentRef.setInput("disabled", true);

    fixture.detectChanges();

    const search = fixture.nativeElement.querySelector(
      '[data-testid="profile-search"]',
    ) as HTMLInputElement;

    expect(search.disabled).toBe(true);
  });

  it("mantiene un estado neutral cuando el perfil confirmado queda oculto por la busqueda", () => {
    fixture.componentRef.setInput("profiles", profiles);

    let emittedProfileId: number | undefined;

    fixture.componentInstance.profileSelected.subscribe((profileId) => {
      emittedProfileId = profileId;
    });

    fixture.detectChanges();

    const search = fixture.nativeElement.querySelector(
      '[data-testid="profile-search"]',
    ) as HTMLInputElement;

    search.value = "auditoria";
    search.dispatchEvent(new Event("input"));

    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement;

    expect(select.value).toBe("");

    const neutralOption = Array.from(select.options).find(
      (option) => option.value === "",
    );

    expect(neutralOption).toBeDefined();
    expect(neutralOption?.textContent?.trim()).toBe("Seleccionar perfil");

    select.value = "2";
    select.dispatchEvent(new Event("change"));

    fixture.detectChanges();

    expect(emittedProfileId).toBe(2);
    expect(select.value).toBe("");
  });
});
