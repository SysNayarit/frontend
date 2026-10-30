import { signal } from "@angular/core";
import { Subscription } from "rxjs";
import { UserSummary } from "../../user.models";
import { UserService } from "../../user.service";

export class BulkRoleUsersStore {
  readonly users = signal<readonly UserSummary[]>([]);
  readonly currentPage = signal(1);
  readonly lastPage = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private requestVersion = 0;
  private activeRequest: Subscription | null = null;

  constructor(private readonly userService: UserService) {}

  load(page: number, roleId?: number): boolean {
    if (
      this.loading() ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > this.lastPage()
    ) {
      return false;
    }

    this.loading.set(true);
    this.error.set(null);

    const version = ++this.requestVersion;

    this.activeRequest = this.userService.list(page, roleId).subscribe({
      next: (response) => {
        if (version !== this.requestVersion) return;

        this.users.set(response.data);
        this.currentPage.set(response.meta.current_page);
        this.lastPage.set(response.meta.last_page);
        this.loading.set(false);
      },
      error: () => {
        if (version !== this.requestVersion) return;

        this.loading.set(false);
        this.error.set("No fue posible consultar los usuarios registrados.");
      },
    });

    return true;
  }

  reset(): void {
    this.invalidate();

    this.users.set([]);
    this.currentPage.set(1);
    this.lastPage.set(1);
    this.error.set(null);
  }

  updateVisibleUsers(
    update: (users: readonly UserSummary[]) => readonly UserSummary[],
  ): void {
    this.users.update(update);
  }

  dispose(): void {
    this.invalidate();
  }

  private invalidate(): void {
    ++this.requestVersion;
    this.activeRequest?.unsubscribe();
    this.activeRequest = null;
    this.loading.set(false);
  }
}
