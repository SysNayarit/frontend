import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";

import { ProfileListResponse, ProfileResponse } from "../../../profile.models";
import { ProfileService } from "../../../profile.service";
import { ProfileContextComponent } from "./profile-context.component";

class ProfileServiceStub {
  getProfilesCalls = 0;

  getProfilesResult: ProfileListResponse = {
    data: [
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
    ],
  };

  getProfiles() {
    this.getProfilesCalls += 1;

    return of(this.getProfilesResult);
  }

  setDefaultProfile(profileId: number) {
    const selected = this.getProfilesResult.data.find(
      (profile) => profile.id === profileId,
    );

    return of({
      data: selected,
    } as ProfileResponse);
  }
}

describe("ProfileContextComponent", () => {
  let fixture: ComponentFixture<ProfileContextComponent>;
  let profiles: ProfileServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileContextComponent],
      providers: [
        {
          provide: ProfileService,
          useClass: ProfileServiceStub,
        },
      ],
    }).compileComponents();

    profiles = TestBed.inject(ProfileService) as unknown as ProfileServiceStub;

    fixture = TestBed.createComponent(ProfileContextComponent);
  });

  it("carga y muestra los perfiles asignados al usuario", () => {
    fixture.detectChanges();

    expect(profiles.getProfilesCalls).toBe(1);

    const select = fixture.nativeElement.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement | null;

    expect(select).not.toBeNull();

    expect(
      Array.from(select?.options ?? []).map((option) =>
        option.textContent?.trim(),
      ),
    ).toEqual(["Personas", "Auditoria"]);

    expect(select?.value).toBe("1");
  });
  it("solicita establecer como predeterminado el perfil seleccionado", () => {
    let requestedProfileId: number | undefined;

    const originalSetDefaultProfile = profiles.setDefaultProfile.bind(profiles);

    profiles.setDefaultProfile = (profileId: number) => {
      requestedProfileId = profileId;

      return originalSetDefaultProfile(profileId);
    };

    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement;

    select.value = "2";

    select.dispatchEvent(new Event("change"));

    expect(requestedProfileId).toBe(2);
  });
  it("actualiza el perfil predeterminado solo con la respuesta confirmada por el backend", () => {
    profiles.setDefaultProfile = (profileId: number) => {
      expect(profileId).toBe(2);

      return of({
        data: {
          id: 2,
          name: "Auditoria",
          code: "PERFIL_AUDITORIA",
          is_default: true,
          group: {
            id: 2,
            name: "Control y supervisión",
            code: "GRUPO_CONTROL_SUPERVISION",
            sort_order: 20,
          },
        },
      } as ProfileResponse);
    };

    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement;

    select.value = "2";

    select.dispatchEvent(new Event("change"));

    const currentProfiles = fixture.componentInstance.profiles();

    expect(
      currentProfiles.find((profile) => profile.id === 1)?.is_default,
    ).toBe(false);

    expect(
      currentProfiles.find((profile) => profile.id === 2)?.is_default,
    ).toBe(true);
  });
  it("deshabilita el selector mientras el cambio de perfil esta en proceso", () => {
    const response = new Subject<ProfileResponse>();

    profiles.setDefaultProfile = (profileId: number) => {
      expect(profileId).toBe(2);

      return response.asObservable();
    };

    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement;

    expect(select.disabled).toBe(false);

    select.value = "2";

    select.dispatchEvent(new Event("change"));

    fixture.detectChanges();

    expect(select.disabled).toBe(true);

    response.next({
      data: {
        id: 2,
        name: "Auditoria",
        code: "PERFIL_AUDITORIA",
        is_default: true,
        group: {
          id: 2,
          name: "Control y supervisión",
          code: "GRUPO_CONTROL_SUPERVISION",
          sort_order: 20,
        },
      },
    });

    response.complete();

    fixture.detectChanges();

    expect(select.disabled).toBe(false);
  });
  it("conserva el perfil actual e informa cuando el backend rechaza el cambio", () => {
    profiles.setDefaultProfile = (profileId: number) => {
      expect(profileId).toBe(2);

      return throwError(() => new Error("Cambio rechazado"));
    };

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    const select = element.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement;

    select.value = "2";

    select.dispatchEvent(new Event("change"));

    fixture.detectChanges();

    expect(select.disabled).toBe(false);

    const currentProfiles = fixture.componentInstance.profiles();

    expect(
      currentProfiles.find((profile) => profile.id === 1)?.is_default,
    ).toBe(true);

    expect(
      currentProfiles.find((profile) => profile.id === 2)?.is_default,
    ).toBe(false);

    const errorMessage = element.querySelector(
      '[data-testid="profile-change-error"]',
    );

    expect(errorMessage).not.toBeNull();

    expect(errorMessage?.textContent).toContain(
      "No fue posible cambiar el perfil",
    );
  });
  it("muestra un estado de carga mientras se consultan los perfiles", () => {
    const response = new Subject<ProfileListResponse>();

    profiles.getProfiles = () => {
      profiles.getProfilesCalls += 1;

      return response.asObservable();
    };

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(profiles.getProfilesCalls).toBe(1);

    expect(
      element.querySelector('[data-testid="profiles-loading"]'),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-testid="profiles-empty-state"]'),
    ).toBeNull();

    response.next(profiles.getProfilesResult);

    response.complete();

    fixture.detectChanges();

    expect(
      element.querySelector('[data-testid="profiles-loading"]'),
    ).toBeNull();

    expect(
      element.querySelector('[data-testid="profile-selector"]'),
    ).not.toBeNull();
  });
  it("informa cuando no es posible cargar los perfiles", () => {
    profiles.getProfiles = () => {
      profiles.getProfilesCalls += 1;

      return throwError(() => new Error("Carga rechazada"));
    };

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(profiles.getProfilesCalls).toBe(1);

    expect(
      element.querySelector('[data-testid="profiles-loading"]'),
    ).toBeNull();

    expect(
      element.querySelector('[data-testid="profiles-empty-state"]'),
    ).toBeNull();

    expect(
      element.querySelector('[data-testid="profile-selector"]'),
    ).toBeNull();

    const errorMessage = element.querySelector(
      '[data-testid="profiles-load-error"]',
    );

    expect(errorMessage).not.toBeNull();

    expect(errorMessage?.textContent).toContain(
      "No fue posible cargar los perfiles",
    );
  });
  it("restaura visualmente el perfil confirmado cuando el cambio es rechazado", () => {
    profiles.setDefaultProfile = (profileId: number) => {
      expect(profileId).toBe(2);

      return throwError(() => new Error("Cambio rechazado"));
    };

    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="profile-selector"]',
    ) as HTMLSelectElement;

    expect(select.value).toBe("1");

    select.value = "2";

    select.dispatchEvent(new Event("change"));

    fixture.detectChanges();

    expect(select.value).toBe("1");
  });
});
