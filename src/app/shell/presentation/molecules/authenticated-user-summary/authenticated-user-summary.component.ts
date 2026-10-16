import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";

import { authenticatedUserDisplayName } from "../../../../auth/authenticated-user-display-name";
import { AuthenticatedUser } from "../../../../auth/auth.models";

@Component({
  selector: "app-authenticated-user-summary",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      @if (user) {
        <div
          class="rounded-xl border border-white/15 bg-white/5 px-4 py-3 sm:text-right"
        >
          <p class="text-sm font-semibold text-white">
            {{ displayName }}
          </p>

          <p class="mt-1 text-xs text-white/65">
            {{ user.email }}
          </p>
        </div>
      }

      <button
        type="button"
        data-testid="logout-button"
        (click)="logoutRequested.emit()"
        class="siga-focus rounded-xl border border-[#e6d194]/50 bg-transparent px-5 py-3 text-sm font-semibold text-[#e6d194] transition hover:bg-white/10"
      >
        Cerrar sesión
      </button>
    </div>
  `,
})
export class AuthenticatedUserSummaryComponent {
  @Input()
  user: AuthenticatedUser | null = null;

  @Output()
  readonly logoutRequested = new EventEmitter<void>();

  get displayName(): string {
    return authenticatedUserDisplayName(this.user);
  }
}
