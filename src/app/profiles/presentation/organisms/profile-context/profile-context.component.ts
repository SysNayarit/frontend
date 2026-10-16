import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { finalize } from "rxjs";

import { Profile } from "../../../profile.models";
import { ProfileService } from "../../../profile.service";
import { ProfileSelectorComponent } from "../../molecules/profile-selector/profile-selector.component";

@Component({
  selector: "app-profile-context",
  standalone: true,
  imports: [ProfileSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      @if (loadingProfiles()) {
        <p
          data-testid="profiles-loading"
          role="status"
          class="rounded-xl border border-[#98989a]/20 bg-[#f9f9f8] px-4 py-3 text-sm text-[#555555]"
        >
          Cargando perfiles...
        </p>
      } @else if (loadError()) {
        <p
          data-testid="profiles-load-error"
          role="alert"
          class="rounded-xl border border-[#9b2247]/25 bg-[#9b2247]/5 px-4 py-3 text-sm text-[#9b2247]"
        >
          {{ loadError() }}
        </p>
      } @else {
        <app-profile-selector
          [profiles]="profiles()"
          [disabled]="changingProfile()"
          (profileSelected)="onProfileSelected($event)"
        />

        @if (changeError()) {
          <p
            data-testid="profile-change-error"
            role="alert"
            class="rounded-xl border border-[#9b2247]/25 bg-[#9b2247]/5 px-4 py-3 text-sm text-[#9b2247]"
          >
            {{ changeError() }}
          </p>
        }
      }
    </div>
  `,
})
export class ProfileContextComponent implements OnInit {
  private readonly profileService = inject(ProfileService);

  readonly profiles = signal<Profile[]>([]);

  readonly loadingProfiles = signal(true);

  readonly loadError = signal<string | null>(null);

  readonly changingProfile = signal(false);

  readonly changeError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadError.set(null);
    this.loadingProfiles.set(true);

    this.profileService
      .getProfiles()
      .pipe(
        finalize(() => {
          this.loadingProfiles.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.profiles.set(response.data);
        },
        error: () => {
          this.loadError.set(
            "No fue posible cargar los perfiles. Intenta nuevamente.",
          );
        },
      });
  }

  onProfileSelected(profileId: number): void {
    if (this.changingProfile()) {
      return;
    }

    this.changeError.set(null);
    this.changingProfile.set(true);

    this.profileService
      .setDefaultProfile(profileId)
      .pipe(
        finalize(() => {
          this.changingProfile.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.profiles.update((currentProfiles) =>
            currentProfiles.map((profile) =>
              profile.id === response.data.id
                ? response.data
                : {
                    ...profile,
                    is_default: false,
                  },
            ),
          );
        },
        error: () => {
          this.changeError.set(
            "No fue posible cambiar el perfil. Intenta nuevamente.",
          );
        },
      });
  }
}
