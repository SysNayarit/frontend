import { Subject, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { UserListResponse, UserSummary } from "../../user.models";
import { UserService } from "../../user.service";
import { BulkRoleUsersStore } from "./bulk-role-users.store";

function makeResponse(ids: number[], page = 1, lastPage = 1): UserListResponse {
  return {
    data: ids.map((id) => ({ id }) as UserSummary),
    meta: {
      current_page: page,
      last_page: lastPage,
      per_page: 20,
      total: ids.length,
    },
  };
}

describe("BulkRoleUsersStore", () => {
  it("consulta el listado general y conserva la paginacion", () => {
    const list = vi.fn(() => of(makeResponse([1, 2], 1, 3)));

    const store = new BulkRoleUsersStore({ list } as unknown as UserService);

    expect(store.load(1)).toBe(true);
    expect(list).toHaveBeenCalledWith(1, undefined);
    expect(store.users().map((user) => user.id)).toEqual([1, 2]);
    expect(store.currentPage()).toBe(1);
    expect(store.lastPage()).toBe(3);
    expect(store.loading()).toBe(false);
  });

  it("conserva el filtro de rol al consultar otra pagina", () => {
    const list = vi.fn(() => of(makeResponse([8], 1, 4)));

    const store = new BulkRoleUsersStore({ list } as unknown as UserService);

    store.load(1, 7);
    store.load(2, 7);

    expect(list).toHaveBeenNthCalledWith(1, 1, 7);
    expect(list).toHaveBeenNthCalledWith(2, 2, 7);
  });

  it("descarta una respuesta pendiente al cambiar de rol", () => {
    const pending = new Subject<UserListResponse>();
    const list = vi
      .fn()
      .mockReturnValueOnce(pending.asObservable())
      .mockReturnValueOnce(of(makeResponse([22])));

    const store = new BulkRoleUsersStore({ list } as unknown as UserService);

    store.load(1, 7);
    expect(store.loading()).toBe(true);

    store.reset();
    expect(store.loading()).toBe(false);

    store.load(1, 9);
    pending.next(makeResponse([11]));

    expect(list).toHaveBeenNthCalledWith(2, 1, 9);
    expect(store.users().map((user) => user.id)).toEqual([22]);
  });

  it("conserva el error y permite reintentar", () => {
    const first = new Subject<UserListResponse>();
    const list = vi
      .fn()
      .mockReturnValueOnce(first.asObservable())
      .mockReturnValueOnce(of(makeResponse([5])));

    const store = new BulkRoleUsersStore({ list } as unknown as UserService);

    store.load(1);
    first.error(new Error("Error de red"));

    expect(store.loading()).toBe(false);
    expect(store.error()).not.toBeNull();

    expect(store.load(1)).toBe(true);
    expect(store.error()).toBeNull();
    expect(store.users().map((user) => user.id)).toEqual([5]);
  });

  it("actualiza usuarios visibles y libera una consulta pendiente", () => {
    const pending = new Subject<UserListResponse>();
    const list = vi
      .fn()
      .mockReturnValueOnce(of(makeResponse([1, 2])))
      .mockReturnValueOnce(pending.asObservable());

    const store = new BulkRoleUsersStore({ list } as unknown as UserService);

    store.load(1);

    store.updateVisibleUsers((users) => users.filter((user) => user.id !== 1));

    expect(store.users().map((user) => user.id)).toEqual([2]);

    store.load(1);
    store.dispose();

    expect(pending.observed).toBe(false);
    expect(store.loading()).toBe(false);
  });
});
