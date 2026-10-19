import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import { ModuleNavigationComponent } from '../../molecules/module-navigation/module-navigation.component';

@Component({
  selector: 'app-personas-management-template',
  standalone: true,
  imports: [
    ModuleNavigationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section
  class="border-b border-[#a57f2c]/20 bg-[#611232] text-white shadow-md"
>
  <div
    class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
  >
    <p
      class="text-xs font-semibold uppercase tracking-[0.18em] text-[#e6d194]"
    >
      Módulo Personas
    </p>

    <h1
      class="siga-title mt-1 text-3xl font-bold tracking-tight"
    >
      Personas
    </h1>

    <p
      class="mt-3 text-sm text-white/75"
    >
      Núcleo de identidad de SIGA
    </p>
  </div>
</section>

<app-module-navigation />

<div
  class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
>
  <section
    class="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
  >
    <div
      class="h-1.5 bg-gradient-to-r from-[#611232] via-[#9b2247] to-[#a57f2c]"
      aria-hidden="true"
    ></div>

    <div class="p-6 sm:p-8">
      <p
        class="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b2247]"
      >
        Personas
      </p>

      <h2
        class="siga-title mt-2 text-3xl font-bold text-[#611232]"
      >
        Gestión de personas
      </h2>

      <p
        class="mt-4 max-w-3xl leading-7 text-[#555555]"
      >
        Consulta de personas registradas en SIGA.
      </p>

      <ng-content />
    </div>
  </section>
</div>
  `,
})
export class PersonasManagementTemplateComponent {}
