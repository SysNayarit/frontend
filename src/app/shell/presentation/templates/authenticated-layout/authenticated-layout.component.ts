import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";

import { AuthContextService } from "../../../../auth/auth-context.service";
import { AuthService } from "../../../../auth/auth.service";
import { ProfileContextComponent } from "../../../../profiles/presentation/organisms/profile-context/profile-context.component";
import { AuthenticatedUserSummaryComponent } from "../../molecules/authenticated-user-summary/authenticated-user-summary.component";
import { MainNavigationComponent } from "../../organisms/main-navigation/main-navigation.component";

@Component({
  selector: "app-authenticated-layout",
  standalone: true,
  imports: [
    AuthenticatedUserSummaryComponent,
    MainNavigationComponent,
    ProfileContextComponent,
    RouterOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="siga-texture flex min-h-screen flex-col bg-[#f7f7f5] text-[#161a1d]"
    >
      <header
        class="w-full overflow-hidden border-b border-[#a57f2c]/30 bg-white shadow-sm"
      >
        <img
          src="/branding/sesnsp-2026-banner.jpg"
          alt="Identidad institucional de la Secretaría de Seguridad y del Secretariado Ejecutivo del Sistema Nacional de Seguridad Pública"
          class="block h-auto w-full"
        />
      </header>

      <section
        class="border-b border-[#a57f2c]/20 bg-[#611232] text-white shadow-md"
      >
        <div
          class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8"
        >
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-[0.18em] text-[#e6d194]"
            >
              Plataforma Integral
            </p>

            <h1
              class="siga-title mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              SIGA
            </h1>

            <p class="mt-3 text-sm text-white/75">
              Sistema Integral de Gestión Académica
            </p>
          </div>

          <div class="flex w-full max-w-2xl flex-col gap-4 lg:items-end">
            <app-authenticated-user-summary
              [user]="user()"
              (logoutRequested)="logout()"
            />

            <div
              class="w-full rounded-xl bg-white p-4 text-[#161a1d] shadow-sm lg:max-w-xl"
            >
              <app-profile-context />
            </div>
          </div>
        </div>
      </section>

      <main
        class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      >
        <div class="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside>
            <app-main-navigation [permissions]="user()?.permissions ?? []" />
          </aside>

          <section class="min-w-0">
            <router-outlet />
          </section>
        </div>
      </main>

      <footer class="border-t border-[#a57f2c]/20 bg-white/90">
        <div class="mx-auto max-w-7xl px-4 py-5 text-center sm:px-6 lg:px-8">
          <p
            class="text-xs font-semibold uppercase tracking-[0.14em] text-[#98989a]"
          >
            Gobierno de México · Seguridad · SESNSP
          </p>
        </div>
      </footer>
    </div>
  `,
})
export class AuthenticatedLayoutComponent implements OnInit {
  private readonly context = inject(AuthContextService);

  private readonly auth = inject(AuthService);

  private readonly router = inject(Router);

  readonly user = this.context.user;

  ngOnInit(): void {
    this.context.ensureCurrent().subscribe({
      error: () => {
        void this.router.navigateByUrl("/acceso");
      },
    });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.context.clear();

        void this.router.navigateByUrl("/acceso");
      },
    });
  }
}
