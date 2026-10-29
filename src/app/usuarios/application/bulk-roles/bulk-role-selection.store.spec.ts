import { describe, expect, it } from "vitest";
import { UserSummary } from "../../user.models";
import { BulkRoleSelectionStore } from "./bulk-role-selection.store";

function makeUser(id: number, linked = true): UserSummary {
  return {
    id,
    person: linked ? { id_persona: id } : null,
  } as UserSummary;
}

describe("BulkRoleSelectionStore", () => {
  it("selecciona un usuario visible con Persona vinculada", () => {
    const store = new BulkRoleSelectionStore();
    const user = makeUser(10);

    expect(store.update({ user, selected: true }, [user])).toBe(true);
    expect(store.selectedUserIds()).toEqual([10]);
    expect(store.selectedUsers()).toEqual([user]);
  });

  it("rechaza usuarios sin Persona, no visibles y duplicados", () => {
    const store = new BulkRoleSelectionStore();
    const user = makeUser(10);
    const unlinked = makeUser(11, false);
    const invisible = makeUser(12);

    expect(store.update({ user: unlinked, selected: true }, [unlinked])).toBe(
      false,
    );

    expect(store.update({ user: invisible, selected: true }, [user])).toBe(
      false,
    );

    expect(store.update({ user, selected: true }, [user])).toBe(true);

    expect(store.update({ user, selected: true }, [user])).toBe(false);
    expect(store.selectedUserIds()).toEqual([10]);
  });

  it("respeta el limite de cien usuarios", () => {
    const store = new BulkRoleSelectionStore();
    const users = Array.from({ length: 101 }, (_, index) =>
      makeUser(index + 1),
    );

    for (const user of users.slice(0, 100)) {
      expect(store.update({ user, selected: true }, users)).toBe(true);
    }

    expect(store.update({ user: users[100], selected: true }, users)).toBe(
      false,
    );

    expect(store.selectedUserIds()).toHaveLength(100);
    expect(store.selectedUsers()).toHaveLength(100);
  });

  it("excluye usuarios y limpia completamente la seleccion", () => {
    const store = new BulkRoleSelectionStore();
    const first = makeUser(1);
    const second = makeUser(2);

    store.update({ user: first, selected: true }, [first, second]);
    store.update({ user: second, selected: true }, [first, second]);

    expect(store.update({ user: first, selected: false }, [])).toBe(true);

    expect(store.selectedUserIds()).toEqual([2]);
    expect(store.selectedUsers()).toEqual([second]);

    store.clear();

    expect(store.selectedUserIds()).toEqual([]);
    expect(store.selectedUsers()).toEqual([]);
    expect(store.update({ user: first, selected: false }, [])).toBe(false);
  });
});
