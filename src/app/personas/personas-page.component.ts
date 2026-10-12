import { Component } from '@angular/core';

@Component({
  selector: 'app-personas-page',
  standalone: true,
  template: `
    <main
      class="siga-texture min-h-screen bg-[#f7f7f5] text-[#161a1d]"
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
          class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        >
          <p
            class="text-xs font-semibold uppercase tracking-[0.18em] text-[#e6d194]"
          >
            Plataforma Integral
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
              Este módulo utilizará exclusivamente las operaciones
              autorizadas por los servicios de SIGA y los permisos
              efectivos del usuario autenticado.
            </p>
          </div>
        </section>
      </div>
    </main>
  `,
})
export class PersonasPageComponent {}
