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
    },
    {
      id: 2,
      name: "Auditoria",
      code: "PERFIL_AUDITORIA",
      is_default: false,
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
});
