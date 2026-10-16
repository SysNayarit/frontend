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
});
