import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";

import { Profile } from "../../../profile.models";

interface ProfileSelectionGroup {
  id: number;
  name: string;
  sortOrder: number;
  profiles: Profile[];
}

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
        <label for="profile-search" class="sr-only">
          Buscar perfil de trabajo
        </label>

        <input
          id="profile-search"
          data-testid="profile-search"
          type="search"
          autocomplete="off"
          placeholder="Buscar por perfil o grupo"
          [disabled]="disabled"
          (input)="onSearch($event)"
          class="siga-focus w-full rounded-xl border border-[#98989a]/30 bg-white px-4 py-3 text-sm text-[#555555] placeholder:text-[#98989a] disabled:cursor-wait disabled:opacity-60"
        />

        @if (groupedProfiles.length > 0) {
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
            @if (!confirmedProfileVisible) {
              <option value="" selected>Seleccionar perfil</option>
            }

            @for (group of groupedProfiles; track group.id) {
              <optgroup [label]="group.name">
                @for (profile of group.profiles; track profile.id) {
                  <option [value]="profile.id" [selected]="profile.is_default">
                    {{ profile.name }}
                  </option>
                }
              </optgroup>
            }
          </select>
        } @else {
          <p
            data-testid="profile-search-empty-state"
            class="rounded-xl border border-[#98989a]/20 bg-[#f9f9f8] px-4 py-3 text-sm text-[#555555]"
          >
            No se encontraron perfiles que coincidan con la búsqueda.
          </p>
        }
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

  searchTerm = "";

  get groupedProfiles(): ProfileSelectionGroup[] {
    const groups = new Map<number, ProfileSelectionGroup>();
    const search = this.normalizeSearch(this.searchTerm);

    for (const profile of this.profiles) {
      const groupMatches =
        search.length === 0 ||
        this.normalizeSearch(profile.group.name).includes(search);

      const profileMatches =
        search.length === 0 ||
        this.normalizeSearch(profile.name).includes(search);

      if (!groupMatches && !profileMatches) {
        continue;
      }

      const existingGroup = groups.get(profile.group.id);

      if (existingGroup) {
        existingGroup.profiles.push(profile);

        continue;
      }

      groups.set(profile.group.id, {
        id: profile.group.id,
        name: profile.group.name,
        sortOrder: profile.group.sort_order,
        profiles: [profile],
      });
    }

    return Array.from(groups.values()).sort(
      (first, second) =>
        first.sortOrder - second.sortOrder ||
        first.name.localeCompare(second.name),
    );
  }

  get confirmedProfileVisible(): boolean {
    return this.groupedProfiles.some((group) =>
      group.profiles.some((profile) => profile.is_default),
    );
  }

  get confirmedProfileValue(): string {
    const confirmedProfile = this.profiles.find(
      (profile) => profile.is_default,
    );

    if (!confirmedProfile || !this.confirmedProfileVisible) {
      return "";
    }

    return String(confirmedProfile.id);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm = input.value;
  }

  onProfileChange(event: Event): void {
    const select = event.target as HTMLSelectElement;

    if (select.value === "") {
      return;
    }

    const selectedProfileId = Number(select.value);

    this.profileSelected.emit(selectedProfileId);

    select.value = this.confirmedProfileValue;
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es-MX")
      .trim();
  }
}
