import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

@Component({
  selector: 'app-module-navigation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      data-testid="module-navigation"
      [attr.aria-label]="navigationTitle"
      class="border-b border-[#a57f2c]/20 bg-white"
    >
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-xs sm:px-6 lg:px-8"
      >
        <span
          class="font-medium uppercase tracking-[0.12em] text-[#777777]"
        >
          {{ navigationTitle }}
        </span>

        <span
          aria-hidden="true"
          class="text-[#a57f2c]"
        >
          &gt;
        </span>

        <a
          href="/inicio"
          data-testid="module-navigation-home"
          class="siga-focus rounded-sm font-semibold text-[#611232] underline-offset-4 transition hover:underline"
        >
          {{ mainMenuLabel }}
        </a>

        <span
          aria-hidden="true"
          class="text-[#a57f2c]"
        >
          &gt;
        </span>

        <span
          data-testid="module-navigation-current"
          aria-current="page"
          class="font-medium text-[#555555]"
        >
          {{ currentLabel }}
        </span>
      </div>
    </nav>
  `,
})
export class ModuleNavigationComponent {
  readonly navigationTitle =
    'Navegación del módulo';

  readonly mainMenuLabel =
    'Menú principal';

  @Input()
  currentLabel =
    'Gestión de personas';
}
