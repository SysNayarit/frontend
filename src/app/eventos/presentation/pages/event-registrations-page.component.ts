import { CommonModule } from "@angular/common";
import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { ChangeDetectorRef, Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import * as QRCode from "qrcode";

type Estado = "REGISTRADA" | "CONFIRMADA" | "LISTA_ESPERA" | "CANCELADA";
type Vinculo = "INTERNO" | "EXTERNO";
type Via = "INVITACION" | "LISTA_ESPECIAL";
type Rol = "ASISTENTE" | "INVITADO_ESPECIAL" | "PONENTE" | "STAFF";

interface Inscripcion {
  id_inscripcion: string;
  id_evento: string;
  id_participante: string;
  fecha_registro: string;
  via_inscripcion: Via;
  estado: Estado;
  rol_evento: Rol;
  tipo_vinculo: Vinculo;
  habilitacion: string;
  participante_nombre: string;
}

interface PaginaInscripciones {
  data: Inscripcion[];
  current_page: number;
  last_page: number;
  total: number;
}

interface Formulario {
  tipo_vinculo: Vinculo;
  id_persona: string;
  nombre_completo: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  email: string;
  telefono: string;
  area: string;
  cargo: string;
  organizacion_origen: string;
  via_inscripcion: Via;
  rol_evento: Rol;
  requerimientos_especiales: string;
}

@Component({
  selector: "app-event-registrations-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="mx-auto max-w-6xl space-y-5 p-4 md:p-7">
      <header class="space-y-2">
        <a routerLink="/eventos/gestion"
           class="text-sm font-semibold text-[#611232]">
          Volver a Gestión de Eventos
        </a>
        <h1 class="text-2xl font-bold text-[#611232]">
          Participantes e inscripciones
        </h1>
        <p class="text-sm text-gray-600">
          Evento seleccionado: {{ evento }}
        </p>
      </header>

      <p *ngIf="mensaje" role="status"
         class="rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
        {{ mensaje }}
      </p>

      <p *ngIf="error" role="alert"
         class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {{ error }}
      </p>

      <section class="rounded-2xl border bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-[#611232]">Inscripciones</h2>
            <p class="text-sm text-gray-600">
              Total con el filtro seleccionado: {{ total }}
            </p>
          </div>

          <button type="button" (click)="mostrarRegistro = !mostrarRegistro"
                  [disabled]="ocupado"
                  class="rounded-lg bg-[#611232] px-4 py-2 font-semibold text-white">
            {{ mostrarRegistro ? "Cerrar formulario" : "Registrar participante" }}
          </button>
        </div>

        <form class="mt-4 flex flex-wrap items-end gap-3"
              (ngSubmit)="cargar(1)">
          <label class="text-sm">
            <span class="mb-1 block font-medium">Filtrar por estado</span>
            <select name="filtroEstado" [(ngModel)]="filtroEstado"
                    class="rounded-lg border p-2">
              <option value="">Todas las inscripciones</option>
              <option value="REGISTRADA">Registradas</option>
              <option value="CONFIRMADA">Confirmadas</option>
              <option value="LISTA_ESPERA">Lista de espera</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </label>

          <button type="submit" [disabled]="ocupado"
                  class="rounded-lg border border-[#611232] px-4 py-2 font-semibold text-[#611232]">
            Aplicar filtro
          </button>
        </form>
      </section>

      <section *ngIf="mostrarRegistro"
               class="rounded-2xl border border-[#a57f2c]/40 bg-white p-5 shadow-sm">
        <h2 class="mb-3 text-lg font-bold text-[#611232]">
          Registrar participante
        </h2>

        <p class="mb-4 text-sm text-gray-600">
          Registro administrativo por invitación o lista especial.
          El autoservicio público se implementará por separado.
        </p>

        <form (ngSubmit)="guardar()" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="text-sm">
              <span class="mb-1 block font-medium">Tipo de participante *</span>
              <select name="tipo_vinculo" required
                      [(ngModel)]="form.tipo_vinculo"
                      class="w-full rounded-lg border p-2">
                <option value="INTERNO">Institucional</option>
                <option value="EXTERNO">Externo</option>
              </select>
            </label>

            <label *ngIf="form.tipo_vinculo === 'INTERNO'" class="text-sm">
              <span class="mb-1 block font-medium">
                ID de Persona institucional *
              </span>
              <input name="id_persona" required
                     [(ngModel)]="form.id_persona"
                     placeholder="UUID de Persona"
                     class="w-full rounded-lg border p-2" />
            </label>

            <ng-container *ngIf="form.tipo_vinculo === 'EXTERNO'">
              <label class="text-sm">
                <span class="mb-1 block font-medium">Nombre completo *</span>
                <input name="nombre_completo" required maxlength="250"
                       [(ngModel)]="form.nombre_completo"
                       class="w-full rounded-lg border p-2" />
              </label>

              <label class="text-sm">
                <span class="mb-1 block font-medium">Tipo de identificación *</span>
                <input name="tipo_identificacion" required maxlength="80"
                       [(ngModel)]="form.tipo_identificacion"
                       class="w-full rounded-lg border p-2" />
              </label>

              <label class="text-sm">
                <span class="mb-1 block font-medium">Número de identificación *</span>
                <input name="numero_identificacion" required maxlength="120"
                       [(ngModel)]="form.numero_identificacion"
                       class="w-full rounded-lg border p-2" />
              </label>
            </ng-container>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Correo de contacto</span>
              <input name="email" type="email" maxlength="254"
                     [(ngModel)]="form.email"
                     class="w-full rounded-lg border p-2" />
            </label>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Teléfono</span>
              <input name="telefono" maxlength="40"
                     [(ngModel)]="form.telefono"
                     class="w-full rounded-lg border p-2" />
            </label>

            <label *ngIf="form.tipo_vinculo === 'INTERNO'" class="text-sm">
              <span class="mb-1 block font-medium">Área institucional</span>
              <input name="area" maxlength="150"
                     [(ngModel)]="form.area"
                     class="w-full rounded-lg border p-2" />
            </label>

            <label *ngIf="form.tipo_vinculo === 'INTERNO'" class="text-sm">
              <span class="mb-1 block font-medium">Cargo</span>
              <input name="cargo" maxlength="150"
                     [(ngModel)]="form.cargo"
                     class="w-full rounded-lg border p-2" />
            </label>

            <label *ngIf="form.tipo_vinculo === 'EXTERNO'" class="text-sm">
              <span class="mb-1 block font-medium">Organización de origen</span>
              <input name="organizacion_origen" maxlength="250"
                     [(ngModel)]="form.organizacion_origen"
                     class="w-full rounded-lg border p-2" />
            </label>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Vía de inscripción *</span>
              <select name="via_inscripcion" required
                      [(ngModel)]="form.via_inscripcion"
                      class="w-full rounded-lg border p-2">
                <option value="INVITACION">Invitación</option>
                <option value="LISTA_ESPECIAL">Lista especial</option>
              </select>
            </label>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Rol en el evento *</span>
              <select name="rol_evento" required
                      [(ngModel)]="form.rol_evento"
                      class="w-full rounded-lg border p-2">
                <option value="ASISTENTE">Asistente</option>
                <option value="INVITADO_ESPECIAL">Invitado especial</option>
                <option value="PONENTE">Ponente</option>
                <option value="STAFF">Staff</option>
              </select>
            </label>

            <label class="text-sm md:col-span-2">
              <span class="mb-1 block font-medium">
                Requerimientos especiales
              </span>
              <textarea name="requerimientos_especiales" rows="2"
                        [(ngModel)]="form.requerimientos_especiales"
                        class="w-full rounded-lg border p-2"></textarea>
            </label>
          </div>

          <div class="flex gap-3">
            <button type="submit" [disabled]="ocupado"
                    class="rounded-lg bg-[#611232] px-5 py-2 font-semibold text-white">
              {{ ocupado ? "Procesando..." : "Registrar inscripción" }}
            </button>
            <button type="button" (click)="cancelarFormulario()"
                    [disabled]="ocupado"
                    class="rounded-lg border px-5 py-2">
              Cancelar
            </button>
          </div>
        </form>
      </section>

      <section *ngIf="qrImagen && qrInscripcion"
               class="rounded-2xl border bg-white p-5 shadow-sm"
               data-testid="event-registration-qr-preview">
        <h2 class="text-lg font-bold text-[#611232]">
          QR de inscripción confirmada
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          El código identifica la inscripción; no contiene datos personales.
        </p>
        <img [src]="qrImagen"
             alt="Código QR exclusivo para inscripción de evento"
             width="320" height="320"
             class="mt-3" />
        <p class="mt-2 text-sm">
          Vence: {{ qrCaducidad | date:"dd/MM/yyyy HH:mm" }}
        </p>
        <button type="button"
                (click)="descargarQrInscripcion()"
                class="mt-3 rounded-lg bg-[#611232] px-4 py-2 font-semibold text-white">
          Descargar PNG
        </button>
      </section>
      <section class="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div class="border-b p-4">
          <h2 class="text-lg font-bold text-[#611232]">
            Lista de participantes
          </h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="p-3">Participante</th>
                <th class="p-3">Vínculo</th>
                <th class="p-3">Rol</th>
                <th class="p-3">Registro</th>
                <th class="p-3">Estado</th>
                <th class="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of inscripciones" class="border-t">
                <td class="p-3">
                  <strong>{{ item.participante_nombre }}</strong>
                  <p class="text-gray-500">
                    {{ item.habilitacion }}
                  </p>
                </td>
                <td class="p-3">{{ item.tipo_vinculo }}</td>
                <td class="p-3">{{ item.rol_evento }}</td>
                <td class="p-3">
                  {{ item.fecha_registro | date:"dd/MM/yyyy HH:mm" }}
                </td>
                <td class="p-3">{{ item.estado }}</td>
                <td class="p-3">
                  <div class="flex flex-wrap gap-2">
                    <button type="button"
                            *ngIf="item.estado === 'CONFIRMADA'"
                            (click)="obtenerQrInscripcion(item)"
                            [disabled]="ocupado"
                            class="rounded-lg border border-[#611232] px-2 py-1 text-[#611232]">
                      Ver / descargar QR
                    </button>
                    <button type="button"
                            *ngIf="item.estado === 'REGISTRADA' || item.estado === 'LISTA_ESPERA'"
                            (click)="cambiarEstado(item, 'CONFIRMADA')"
                            [disabled]="ocupado"
                            class="rounded-lg border border-green-700 px-2 py-1 text-green-800">
                      Confirmar
                    </button>

                    <button type="button"
                            *ngIf="item.estado === 'REGISTRADA'"
                            (click)="cambiarEstado(item, 'LISTA_ESPERA')"
                            [disabled]="ocupado"
                            class="rounded-lg border px-2 py-1">
                      Lista de espera
                    </button>

                    <button type="button"
                            *ngIf="item.estado !== 'CANCELADA'"
                            (click)="cambiarEstado(item, 'CANCELADA')"
                            [disabled]="ocupado"
                            class="rounded-lg border border-red-700 px-2 py-1 text-red-800">
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="!ocupado && inscripciones.length === 0">
                <td colspan="6" class="p-6 text-center text-gray-500">
                  No hay inscripciones para este filtro.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="flex items-center justify-between gap-3 border-t p-4">
          <span class="text-sm text-gray-600">
            {{ total }} inscripciones
          </span>

          <div class="flex items-center gap-3">
            <button type="button" (click)="cargar(pagina - 1)"
                    [disabled]="ocupado || pagina <= 1"
                    class="rounded-lg border px-3 py-2 disabled:opacity-40">
              Anterior
            </button>
            <span class="text-sm">{{ pagina }} / {{ paginas }}</span>
            <button type="button" (click)="cargar(pagina + 1)"
                    [disabled]="ocupado || pagina >= paginas"
                    class="rounded-lg border px-3 py-2 disabled:opacity-40">
              Siguiente
            </button>
          </div>
        </footer>
      </section>
    </main>
  `,
})
export class EventRegistrationsPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  evento = "";
  inscripciones: Inscripcion[] = [];
  pagina = 1;
  paginas = 1;
  total = 0;
  filtroEstado = "";
  mostrarRegistro = false;
  ocupado = false;
  error = "";
  mensaje = "";
  qrImagen: string | null = null;
  qrInscripcion: string | null = null;
  qrCaducidad = "";


  form: Formulario = this.formVacio();

  private get api(): string {
    return `/api/eventos/${this.evento}/inscripciones`;
  }

  ngOnInit(): void {
    this.evento = this.route.snapshot.paramMap.get("evento") ?? "";

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.evento)) {
      this.error = "Identificador de evento inválido.";
      return;
    }

    void this.cargar();
  }

  private formVacio(): Formulario {
    return {
      tipo_vinculo: "EXTERNO",
      id_persona: "",
      nombre_completo: "",
      tipo_identificacion: "",
      numero_identificacion: "",
      email: "",
      telefono: "",
      area: "",
      cargo: "",
      organizacion_origen: "",
      via_inscripcion: "INVITACION",
      rol_evento: "ASISTENTE",
      requerimientos_especiales: "",
    };
  }

  private errorServidor(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) return "No dispone de permisos para esta operación.";
      if (error.status === 409 || error.status === 422) {
        return typeof error.error?.message === "string"
          ? error.error.message
          : fallback;
      }
    }
    return fallback;
  }

  async obtenerQrInscripcion(item: Inscripcion): Promise<void> {
    if (this.ocupado || item.estado !== "CONFIRMADA") return;

    this.ocupado = true;
    this.error = "";
    this.mensaje = "";
    this.qrImagen = null;
    this.qrInscripcion = null;

    try {
      const url = `${this.api}/${item.id_inscripcion}/qr`;
      type RespuestaQr = {
        data: {
          uid_qr: string;
          estado: string;
          caduca_en: string;
        };
      };

      let response: RespuestaQr;

      try {
        response = await firstValueFrom(
          this.http.get<RespuestaQr>(url),
        );
      } catch (error) {
        if (!(error instanceof HttpErrorResponse) || error.status !== 404) {
          throw error;
        }

        response = await firstValueFrom(
          this.http.post<RespuestaQr>(url, {}),
        );
      }

      if (response.data.estado !== "ACTIVO") {
        throw new Error("QR no activo");
      }

      // Mismo mecanismo PNG usado por el generador institucional.
      // Solo cambia el UUID de origen: la inscripción confirmada.
      this.qrImagen = await QRCode.toDataURL(response.data.uid_qr, {
        errorCorrectionLevel: "M",
        margin: 3,
        width: 320,
      });

      this.qrInscripcion = item.id_inscripcion;
      this.qrCaducidad = response.data.caduca_en;
      this.mensaje = "QR de inscripción disponible.";
    } catch (error) {
      this.error = this.errorServidor(
        error,
        "No fue posible recuperar o emitir el QR de la inscripción.",
      );
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }

  descargarQrInscripcion(): void {
    if (!this.qrImagen || !this.qrInscripcion) return;

    const link = document.createElement("a");
    link.href = this.qrImagen;
    link.download = `SIGA-EVENTO-${this.qrInscripcion}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  async cargar(pagina = 1): Promise<void> {
    if (this.ocupado || !this.evento) return;

    this.ocupado = true;
    this.error = "";

    try {
      let params = new HttpParams().set("page", String(pagina));
      if (this.filtroEstado) {
        params = params.set("estado", this.filtroEstado);
      }

      const result = await firstValueFrom(
        this.http.get<PaginaInscripciones>(this.api, { params }),
      );

      this.inscripciones = result.data;
      this.pagina = result.current_page;
      this.paginas = Math.max(result.last_page, 1);
      this.total = result.total;
    } catch (error) {
      this.error = this.errorServidor(
        error,
        "No fue posible consultar las inscripciones del evento.",
      );
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }

  cancelarFormulario(): void {
    this.mostrarRegistro = false;
    this.form = this.formVacio();
  }

  async guardar(): Promise<void> {
    if (this.ocupado) return;

    this.error = "";
    this.mensaje = "";

    const f = this.form;
    const interno = f.tipo_vinculo === "INTERNO";

    if (interno && !f.id_persona.trim()) {
      this.error = "Seleccione una Persona institucional.";
      return;
    }

    if (!interno && (
      !f.nombre_completo.trim() ||
      !f.tipo_identificacion.trim() ||
      !f.numero_identificacion.trim()
    )) {
      this.error = "Complete la identificación del participante externo.";
      return;
    }

    const payload = {
      tipo_vinculo: f.tipo_vinculo,
      ...(interno ? {
        id_persona: f.id_persona.trim(),
        area: f.area.trim() || null,
        cargo: f.cargo.trim() || null,
      } : {
        nombre_completo: f.nombre_completo.trim(),
        tipo_identificacion: f.tipo_identificacion.trim(),
        numero_identificacion: f.numero_identificacion.trim(),
        organizacion_origen: f.organizacion_origen.trim() || null,
      }),
      email: f.email.trim() || null,
      telefono: f.telefono.trim() || null,
      via_inscripcion: f.via_inscripcion,
      rol_evento: f.rol_evento,
      requerimientos_especiales: f.requerimientos_especiales.trim() || null,
    };

    this.ocupado = true;

    try {
      await firstValueFrom(this.http.post(this.api, payload));

      this.mensaje = "Participante inscrito correctamente.";
      this.form = this.formVacio();
      this.mostrarRegistro = false;
    } catch (error) {
      this.error = this.errorServidor(
        error,
        "No fue posible registrar la inscripción.",
      );
      return;
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }

    await this.cargar(1);
  }

  async cambiarEstado(item: Inscripcion, estado: Estado): Promise<void> {
    if (this.ocupado || item.estado === estado) return;

    if (estado === "CANCELADA" &&
        !confirm("¿Confirma la cancelación de esta inscripción?")) {
      return;
    }

    this.ocupado = true;
    this.error = "";
    this.mensaje = "";

    try {
      await firstValueFrom(
        this.http.patch(
          `${this.api}/${item.id_inscripcion}/estado`,
          { estado },
        ),
      );
      this.mensaje = `Inscripción actualizada: ${estado}.`;
    } catch (error) {
      this.error = this.errorServidor(
        error,
        "No fue posible modificar el estado de la inscripción.",
      );
      return;
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }

    await this.cargar(this.pagina);
  }
}