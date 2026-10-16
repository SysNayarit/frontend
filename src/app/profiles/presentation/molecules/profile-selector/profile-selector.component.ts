import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";

import { Profile } from "../../../profile.models";

@Component({
  selector: "app-profile-selector",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-2">
      <p
        class="text-xs font-semibold uppercase tracking-[0.15em] text-[#98989a]"
      >
        Perfil de trabajo
      </p>

      @if (profiles.length > 0) {
        <label for="profile-selector" class="sr-only">
          Seleccionar perfil de trabajo
        </label>

        <select
          id="profile-selector"
          data-testid="profile-selector"
          [disabled]="disabled"
          (change)="onProfileChange($event)"
          class="siga-focus w-full rounded-xl border border-[#98989a]/30 bg-white px-4 py-3 text-sm font-semibold text-[#611232] disabled:cursor-wait disabled:opacity-60"
        >
          @for (profile of profiles; track profile.id) {
            <option [value]="profile.id" [selected]="profile.is_default">
              {{ profile.name }}
            </option>
          }
        </select>
      } @else {
        <p
          data-testid="profiles-empty-state"
          class="rounded-xl border border-[#98989a]/20 bg-[#f9f9f8] px-4 py-3 text-sm text-[#555555]"
        >
          No tienes perfiles asignados.
        </p>
      }
    </div>
  `,
})
export class ProfileSelectorComponent {
  @Input({ required: true })
  profiles!: Profile[];

  @Input()
  disabled = false;

  @Output()
  readonly profileSelected = new EventEmitter<number>();

  onProfileChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedProfileId = Number(select.value);

    this.profileSelected.emit(selectedProfileId);

    const confirmedProfile = this.profiles.find(
      (profile) => profile.is_default,
    );

    if (confirmedProfile) {
      select.value = String(confirmedProfile.id);
    }
  }
}
