import { CommonModule } from "@angular/common";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { PersonListItem } from "../../../personas/person.models";
import { PersonService } from "../../../personas/person.service";

interface CredencialInstitucional {
  id_credencial: string;
  id_persona: string;
  folio: string;
  uid_qr: string;
  categoria: string;
  estado: string;
  vigente_desde: string | null;
  vigente_hasta: string | null;
}

interface RespuestaEmision {
  message: string;
  credencial: CredencialInstitucional;
}

@Component({
  selector: "app-institutional-credential-issue-page",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="mx-auto max-w-5xl space-y-5 p-5">
      <header class="rounded-xl border bg-white p-5">
        <h1 class="text-2xl font-bold text-[#611232]">
          Emision de credenciales institucionales
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          Seleccione una Persona registrada en SIGA.
          La identidad y el folio no se capturan nuevamente.
        </p>
      </header>

      <p
        *ngIf="error"
        role="alert"
        class="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800"
      >
        {{ error }}
      </p>

      <p
        *ngIf="aviso"
        role="status"
        class="rounded-lg border border-green-300 bg-green-50 p-3 text-green-900"
      >
        {{ aviso }}
      </p>

      <div class="rounded-xl border bg-white p-5">
        <h2 class="mb-3 text-lg font-semibold">Seleccionar titular</h2>

        <p *ngIf="cargandoPersonas" class="py-2">
          Consultando Personas...
        </p>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b bg-gray-100">
              <tr>
                <th class="p-3">Seleccion</th>
                <th class="p-3">Expediente</th>
                <th class="p-3">Persona</th>
                <th class="p-3">Estado</th>
              </tr>
            </thead>

            <tbody>
              <tr
                *ngFor="let person of personas"
                class="border-b"
              >
                <td class="p-3">
                  <input
                    type="radio"
                    name="titularCredencial"
                    [value]="person.id_persona"
                    [checked]="titular?.id_persona === person.id_persona"
                    [disabled]="emitiendo"
                    (change)="seleccionar(person)"
                    [attr.aria-label]="'Seleccionar ' + person.nombres"
                  />
                </td>

                <td class="p-3">
                  {{ person.num_expediente }}
                </td>

                <td class="p-3">
                  {{ nombreCompleto(person) }}
                </td>

                <td class="p-3">
                  {{ person.estatus }}
                </td>
              </tr>

              <tr *ngIf="!cargandoPersonas && personas.length === 0">
                <td colspan="4" class="p-4">
                  No hay Personas disponibles en esta pagina.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            type="button"
            class="rounded border px-3 py-2 disabled:opacity-50"
            [disabled]="cargandoPersonas || emitiendo || pagina <= 1"
            (click)="cargarPersonas(pagina - 1)"
          >
            Anterior
          </button>

          <span>Pagina {{ pagina }} de {{ totalPaginas }}</span>

          <button
            type="button"
            class="rounded border px-3 py-2 disabled:opacity-50"
            [disabled]="cargandoPersonas || emitiendo || pagina >= totalPaginas"
            (click)="cargarPersonas(pagina + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>

      <form
        class="space-y-4 rounded-xl border bg-white p-5"
        (submit)="emitir($event)"
      >
        <h2 class="text-lg font-semibold">Emitir credencial</h2>

        <div *ngIf="titular" class="rounded bg-gray-50 p-3">
          <p class="font-semibold">{{ nombreCompleto(titular) }}</p>
          <p>Expediente: {{ titular.num_expediente }}</p>
          <p>Estado institucional: {{ titular.estatus }}</p>
        </div>

        <p *ngIf="!titular">
          Seleccione primero una Persona del listado.
        </p>

        <label class="block space-y-2">
          <span class="font-semibold">Categoria institucional</span>
          <input
            #campoCategoria
            type="text"
            maxlength="40"
            class="w-full rounded border px-3 py-2 uppercase"
            placeholder="Categoria autorizada"
            [value]="categoria"
            [disabled]="emitiendo"
            (input)="categoria = campoCategoria.value.toUpperCase().trim()"
          />
          <span class="block text-xs text-gray-600">
            Utilice la categoria institucional correspondiente.
            No se asigna automaticamente.
          </span>
        </label>

        <button
          type="submit"
          class="rounded bg-[#611232] px-5 py-3 font-semibold text-white disabled:opacity-50"
          [disabled]="!titular || emitiendo || cargandoPersonas"
        >
          {{ emitiendo ? "Emitiendo..." : "Emitir credencial" }}
        </button>
      </form>

      <section
        *ngIf="credencialEmitida as credencial"
        class="space-y-3 rounded-xl border bg-white p-5"
        aria-label="Resultado de emision"
      >
        <h2 class="text-lg font-semibold">
          Credencial institucional emitida
        </h2>

        <dl class="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="font-semibold">Folio</dt>
            <dd>{{ credencial.folio }}</dd>
          </div>
          <div>
            <dt class="font-semibold">Categoria</dt>
            <dd>{{ credencial.categoria }}</dd>
          </div>
          <div>
            <dt class="font-semibold">Estado</dt>
            <dd>{{ credencial.estado }}</dd>
          </div>
          <div>
            <dt class="font-semibold">Vigente desde</dt>
            <dd>{{ credencial.vigente_desde || "No especificado" }}</dd>
          </div>
          <div>
            <dt class="font-semibold">Vigente hasta</dt>
            <dd>{{ credencial.vigente_hasta || "No especificado" }}</dd>
          </div>
          <div>
            <dt class="font-semibold">Identificador de credencial</dt>
            <dd class="break-all">{{ credencial.id_credencial }}</dd>
          </div>
        </dl>

        <p class="text-xs text-gray-600">
          Esta pantalla presenta el resultado confirmado por la API.
          La impresion institucional se habilitara en su etapa correspondiente.
        </p>
      </section>
    </section>
  `,
})
export class InstitutionalCredentialIssuePageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly personService = inject(PersonService);

  personas: PersonListItem[] = [];
  titular: PersonListItem | null = null;
  pagina = 1;
  totalPaginas = 1;
  cargandoPersonas = false;
  emitiendo = false;
  categoria = "";
  error = "";
  aviso = "";
  credencialEmitida: CredencialInstitucional | null = null;

  ngOnInit(): void {
    void this.cargarPersonas(1);
  }

  nombreCompleto(person: PersonListItem): string {
    return [
      person.nombres,
      person.apellido_paterno,
      person.apellido_materno,
    ].filter(Boolean).join(" ");
  }

  seleccionar(person: PersonListItem): void {
    if (this.emitiendo) {
      return;
    }

    this.titular = person;
    this.credencialEmitida = null;
    this.aviso = "";
    this.error = "";
  }

  async cargarPersonas(page: number): Promise<void> {
    if (this.cargandoPersonas || this.emitiendo || page < 1) {
      return;
    }

    this.cargandoPersonas = true;
    this.error = "";

    try {
      const response = await firstValueFrom(this.personService.list(page));
      this.personas = response.data;
      this.pagina = response.meta.current_page;
      this.totalPaginas = Math.max(1, response.meta.last_page);
      this.titular = null;
      this.credencialEmitida = null;
      this.aviso = "";
    } catch (error: unknown) {
      this.error = this.mensajeError(error, "consultar Personas");
    } finally {
      this.cargandoPersonas = false;
    }
  }

  async emitir(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.titular || this.emitiendo) {
      return;
    }

    const categoria = this.categoria.trim().toUpperCase();

    if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(categoria)) {
      this.error = "La categoria institucional tiene un formato invalido.";
      return;
    }

    this.emitiendo = true;
    this.error = "";
    this.aviso = "";
    this.credencialEmitida = null;

    try {
      const response = await firstValueFrom(
        this.http.post<RespuestaEmision>(
          "/api/credenciales/emitir",
          {
            id_persona: this.titular.id_persona,
            categoria,
          },
        ),
      );

      if (
        !response.credencial?.id_credencial ||
        !response.credencial?.folio
      ) {
        throw new Error("Respuesta institucional incompleta.");
      }

      this.credencialEmitida = response.credencial;
      this.aviso = response.message || "Credencial emitida.";
    } catch (error: unknown) {
      this.error = this.mensajeError(error, "emitir la credencial");
    } finally {
      this.emitiendo = false;
    }
  }

  private mensajeError(error: unknown, operacion: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return "La sesion no es valida. Vuelva a autenticarse.";
      }
      if (error.status === 403) {
        return "La operacion requiere permisos o reautenticacion.";
      }
      if (error.status === 409) {
        return "No fue posible emitir la credencial. Revise su estado institucional.";
      }
      if (error.status === 422) {
        return "Los datos de emision no fueron aceptados por SIGA.";
      }
    }

    return `No fue posible ${operacion}.`;
  }
}