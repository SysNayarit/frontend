import { UsersModuleNavigationComponent } from "../../molecules/users-module-navigation/users-module-navigation.component";
import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { switchMap } from "rxjs";

import { AuthContextService } from "../../../../auth/auth-context.service";
import { AuthService } from "../../../../auth/auth.service";
import { AvailablePerson } from "../../../user.models";
import { UserService } from "../../../user.service";
import { AvailablePersonSelectorComponent } from "../../organisms/available-person-selector/available-person-selector.component";
import {
  UserCreateFormComponent,
  UserCreateFormValue,
} from "../../organisms/user-create-form/user-create-form.component";

@Component({
  selector: "app-user-registration-page",
  standalone: true,
  imports: [
    UsersModuleNavigationComponent,
    RouterLink,
    AvailablePersonSelectorComponent,
    UserCreateFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="space-y-5">
      <app-users-module-navigation />
      <nav aria-label="Navegación de usuarios">
        <a
          routerLink="/usuarios/menu"
          class="siga-focus text-sm font-medium text-[#611232] underline"
        >
          Gestión de usuarios
        </a>
        <span class="mx-2 text-gray-400">&gt;</span>
        <span class="text-sm text-gray-600">Registro de usuarios</span>
      </nav>

      <header class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 class="text-2xl font-bold text-[#611232]">Registro de usuarios</h1>
        <p class="mt-2 text-sm text-gray-600">
          Crea una cuenta para una Persona registrada que todavía no tenga
          usuario asociado.
        </p>
      </header>

      @if (!canCreateUsers()) {
        <p
          role="alert"
          class="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700"
        >
          No tienes permiso para registrar usuarios.
        </p>
      } @else {
        <section class="rounded-xl border border-[#e7e2e3] bg-white p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-[#611232]">
              Seleccionar Persona registrada
            </h2>
            <button
              type="button"
              data-testid="registration-select-person"
              [disabled]="creatingUser()"
              (click)="togglePersonSelector()"
              class="siga-focus rounded-lg bg-[#611232] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {{ personSelectorOpen() ? "Cerrar búsqueda" : "Buscar Persona" }}
            </button>
          </div>

          @if (personSelectorOpen()) {
            <div class="mt-4">
              <app-available-person-selector
                (personSelected)="choosePerson($event)"
              />
            </div>
          }
        </section>

        @if (createUserNotice()) {
          <p
            role="status"
            data-testid="registration-success"
            class="rounded-xl border border-[#a57f2c]/30 bg-white p-4 text-sm text-[#611232]"
          >
            {{ createUserNotice() }}
          </p>
        }

        @if (selectedPerson()) {
          @if (createUserError()) {
            <p
              role="alert"
              data-testid="registration-error"
              class="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700"
            >
              {{ createUserError() }}
            </p>
          }

          <app-user-create-form
            [person]="selectedPerson()!"
            [processing]="creatingUser()"
            (confirm)="confirmCreateUser($event)"
            (cancel)="cancelCreateUser()"
          />
        }
      }
    </main>
  `,
})
export class UserRegistrationPageComponent {
  private readonly authContext = inject(AuthContextService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly createForm = viewChild(UserCreateFormComponent);

  readonly personSelectorOpen = signal(true);
  readonly selectedPerson = signal<AvailablePerson | null>(null);
  readonly creatingUser = signal(false);
  readonly createUserError = signal<string | null>(null);
  readonly createUserNotice = signal<string | null>(null);

  canCreateUsers(): boolean {
    return this.authContext.hasPermission("usuarios.crear");
  }

  private clearPasswords(): void {
    this.createForm()?.form.patchValue({
      password: "",
      password_confirmation: "",
      administratorPassword: "",
    });
  }

  togglePersonSelector(): void {
    if (!this.canCreateUsers() || this.creatingUser()) return;

    this.clearPasswords();
    this.createUserError.set(null);
    this.createUserNotice.set(null);
    this.selectedPerson.set(null);
    this.personSelectorOpen.update((open) => !open);
  }

  choosePerson(person: AvailablePerson): void {
    if (
      !this.canCreateUsers() ||
      !this.personSelectorOpen() ||
      this.creatingUser()
    ) {
      return;
    }

    this.selectedPerson.set(person);
    this.personSelectorOpen.set(false);
    this.createUserError.set(null);
  }

  cancelCreateUser(): void {
    if (this.creatingUser()) return;

    this.clearPasswords();
    this.selectedPerson.set(null);
    this.personSelectorOpen.set(true);
    this.createUserError.set(null);
  }

  confirmCreateUser(value: UserCreateFormValue): void {
    const person = this.selectedPerson();

    if (
      person === null ||
      !this.canCreateUsers() ||
      this.creatingUser() ||
      !value.email.trim() ||
      value.password.length < 15 ||
      value.password !== value.password_confirmation ||
      !value.administratorPassword
    ) {
      return;
    }

    const payload = {
      id_persona: person.id_persona,
      email: value.email.trim().toLowerCase(),
      password: value.password,
      password_confirmation: value.password_confirmation,
    };

    let stage: "reauthentication" | "creation" = "reauthentication";

    this.creatingUser.set(true);
    this.createUserError.set(null);
    this.createUserNotice.set(null);

    this.authService
      .reauthenticate(value.administratorPassword)
      .pipe(
        switchMap(() => {
          stage = "creation";
          this.clearPasswords();
          return this.userService.create(payload);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.clearPasswords();
          this.creatingUser.set(false);
          this.selectedPerson.set(null);
          this.personSelectorOpen.set(true);
          this.createUserNotice.set(
            "Usuario creado correctamente. Puedes registrar otra Persona o consultar Usuarios registrados.",
          );
        },
        error: (error: unknown) => {
          this.clearPasswords();
          this.creatingUser.set(false);

          if (stage === "reauthentication") {
            this.createUserError.set(
              "No fue posible confirmar la contraseña del administrador.",
            );
            return;
          }

          if (error instanceof HttpErrorResponse) {
            if (error.status === 422) {
              this.createUserError.set(
                "Verifica el correo o si la Persona ya tiene una cuenta asociada.",
              );
              return;
            }
            if (error.status === 403) {
              this.createUserError.set(
                "No tienes permiso para crear usuarios.",
              );
              return;
            }
            if (error.status === 423) {
              this.createUserError.set("La reautenticación ha caducado.");
              return;
            }
          }

          this.createUserError.set(
            "No fue posible crear el usuario. Intenta nuevamente.",
          );
        },
      });
  }
}
