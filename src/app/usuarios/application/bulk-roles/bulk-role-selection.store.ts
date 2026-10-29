import { signal } from "@angular/core";
import { UserSummary } from "../../user.models";

export class BulkRoleSelectionStore {
  readonly selectedUserIds = signal<readonly number[]>([]);
  readonly selectedUsers = signal<readonly UserSummary[]>([]);

  clear(): void {
    this.selectedUserIds.set([]);
    this.selectedUsers.set([]);
  }

  update(
    event: { user: UserSummary; selected: boolean },
    availableUsers: readonly UserSummary[],
  ): boolean {
    const ids = this.selectedUserIds();

    if (!event.selected) {
      if (!ids.includes(event.user.id)) {
        return false;
      }

      this.selectedUserIds.set(ids.filter((id) => id !== event.user.id));
      this.selectedUsers.update((users) =>
        users.filter((user) => user.id !== event.user.id),
      );

      return true;
    }

    if (
      event.user.person === null ||
      !availableUsers.some(
        (user) => user.id === event.user.id && user.person !== null,
      ) ||
      ids.includes(event.user.id) ||
      ids.length >= 100
    ) {
      return false;
    }

    this.selectedUserIds.set([...ids, event.user.id]);
    this.selectedUsers.update((users) => [
      ...users.filter((user) => user.id !== event.user.id),
      event.user,
    ]);

    return true;
  }
}
