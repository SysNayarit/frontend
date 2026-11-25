import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { ChangeDetectorRef, Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";

type EstadoEvento = "PLANEADO" | "PUBLICADO" | "EN_CURSO" | "CERRADO" | "CANCELADO";
type ModalidadEvento = "PRESENCIAL" | "VIRTUAL" | "MIXTA";

interface Evento {
  id_evento: string;
  nombre: string;
  tipo: string;
  tema_principal: string;
  sede: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  capacidad: number | null;
  estado: EstadoEvento;
  modalidad: ModalidadEvento;
  indicaciones: string | null;
}

interface PaginaEventos {
  data: Evento[];
  current_page: number;
  last_page: number;
  total: number;
}

interface FormularioEvento {
  nombre: string;
  tipo: string;
  tema_principal: string;
  sede: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  capacidad: number | null;
  modalidad: ModalidadEvento;
  indicaciones: string;
  estado: EstadoEvento;
}

@Component({
  selector: "app-event-management-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="mx-auto max-w-6xl space-y-6 p-4 md:p-7">
      <header class="space-y-2">
        <p class="text-xs font-bold uppercase tracking-widest text-[#a57f2c]">
          SIGA · Eventos
        </p>
        <h1 class="text-2xl font-bold text-[#611232]">Gestión de Eventos</h1>
        <p class="text-sm text-gray-600">
          Administración de eventos institucionales, sociales y académicos.
        </p>
      </header>

      <div *ngIf="error" role="alert"
           class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {{ error }}
      </div>

      <div *ngIf="mensaje" role="status"
           class="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">
        {{ mensaje }}
      </div>

      <section class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-xl border bg-white p-4 shadow-sm">
          <p class="text-sm text-gray-500">Eventos encontrados</p>
          <p class="text-3xl font-bold text-[#611232]">{{ total }}</p>
        </div>
        <div class="rounded-xl border bg-white p-4 shadow-sm">
          <p class="text-sm text-gray-500">Mostrados en esta página</p>
          <p class="text-3xl font-bold text-[#611232]">{{ eventos.length }}</p>
        </div>
        <div class="rounded-xl border bg-white p-4 shadow-sm">
          <p class="text-sm text-gray-500">Página</p>
          <p class="text-3xl font-bold text-[#611232]">
            {{ pagina }} / {{ paginas }}
          </p>
        </div>
      </section>

      <section class="rounded-2xl border bg-white p-4 shadow-sm">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-bold text-[#611232]">Buscar eventos</h2>
          <button type="button" (click)="nuevo()" [disabled]="ocupado"
                  class="rounded-lg bg-[#611232] px-4 py-2 font-semibold text-white">
            Crear evento
          </button>
        </div>

        <form class="grid gap-3 md:grid-cols-4" (ngSubmit)="cargar(1)">
          <label class="text-sm">
            <span class="mb-1 block font-medium">Nombre, tema o tipo</span>
            <input name="buscar" [(ngModel)]="buscar"
                   class="w-full rounded-lg border p-2" placeholder="Buscar evento" />
          </label>

          <label class="text-sm">
            <span class="mb-1 block font-medium">Estado</span>
            <select name="filtroEstado" [(ngModel)]="filtroEstado"
                    class="w-full rounded-lg border p-2">
              <option value="">Todos</option>
              <option value="PLANEADO">Planeado</option>
              <option value="PUBLICADO">Publicado</option>
              <option value="EN_CURSO">En curso</option>
              <option value="CERRADO">Cerrado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </label>

          <label class="text-sm">
            <span class="mb-1 block font-medium">Modalidad</span>
            <select name="filtroModalidad" [(ngModel)]="filtroModalidad"
                    class="w-full rounded-lg border p-2">
              <option value="">Todas</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="MIXTA">Mixta</option>
            </select>
          </label>

          <div class="flex items-end gap-2">
            <button type="submit" [disabled]="ocupado"
                    class="rounded-lg border border-[#611232] px-4 py-2 font-semibold text-[#611232]">
              Buscar
            </button>
            <button type="button" (click)="limpiarFiltros()" [disabled]="ocupado"
                    class="rounded-lg border px-3 py-2">Limpiar</button>
          </div>
        </form>
      </section>

      <section *ngIf="mostrarFormulario"
               class="rounded-2xl border border-[#a57f2c]/40 bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-lg font-bold text-[#611232]">
          {{ editandoId ? "Actualizar evento" : "Registrar evento" }}
        </h2>

        <form (ngSubmit)="guardar()" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="text-sm">
              <span class="mb-1 block font-medium">Nombre oficial *</span>
              <input name="nombre" required maxlength="250"
                     [(ngModel)]="form.nombre"
                     class="w-full rounded-lg border p-2" />
            </label>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Tipo de evento *</span>
              <input name="tipo" required maxlength="100"
                     [(ngModel)]="form.tipo"
                     placeholder="Conferencia, taller, ceremonia..."
                     class="w-full rounded-lg border p-2" />
            </label>

            <label class="text-sm md:col-span-2">
              <span class="mb-1 block font-medium">Tema principal *</span>
              <textarea name="tema_principal" required rows="2"
                        [(ngModel)]="form.tema_principal"
                        class="w-full rounded-lg border p-2"></textarea>
            </label>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Sede</span>
              <input name="sede" [(ngModel)]="form.sede"
                     maxlength="250" class="w-full rounded-lg border p-2" />
            </label>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Dirección</span>
              <input name="direccion" [(ngModel)]="form.direccion"
                     class="w-full rounded-lg border p-2" />
            </label>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Latitud (opcional)</span>
              <input name="latitud" type="number" step="any" min="-90" max="90"
                     [(ngModel)]="form.latitud"
                     class="w-full rounded-lg border p-2" />
            </label>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Longitud (opcional)</span>
              <input name="longitud" type="number" step="any" min="-180" max="180"
                     [(ngModel)]="form.longitud"
                     class="w-full rounded-lg border p-2" />
            </label>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Inicio *</span>
              <input name="fecha_inicio" type="datetime-local" required
                     [(ngModel)]="form.fecha_inicio"
                     class="w-full rounded-lg border p-2" />
            </label>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Finalización *</span>
              <input name="fecha_fin" type="datetime-local" required
                     [(ngModel)]="form.fecha_fin"
                     class="w-full rounded-lg border p-2" />
            </label>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Capacidad (opcional)</span>
              <input name="capacidad" type="number" min="1"
                     [(ngModel)]="form.capacidad"
                     class="w-full rounded-lg border p-2" />
            </label>

            <label class="text-sm">
              <span class="mb-1 block font-medium">Modalidad *</span>
              <select name="modalidad" required [(ngModel)]="form.modalidad"
                      class="w-full rounded-lg border p-2">
                <option value="PRESENCIAL">Presencial</option>
                <option value="VIRTUAL">Virtual</option>
                <option value="MIXTA">Mixta</option>
              </select>
            </label>

            <label *ngIf="editandoId" class="text-sm">
              <span class="mb-1 block font-medium">Estado</span>
              <select name="estado" [(ngModel)]="form.estado"
                      class="w-full rounded-lg border p-2">
                <option *ngFor="let estado of estadosPermitidos"
                        [value]="estado">{{ estado }}</option>
              </select>
            </label>

            <label class="text-sm md:col-span-2">
              <span class="mb-1 block font-medium">Indicaciones</span>
              <textarea name="indicaciones" rows="3"
                        [(ngModel)]="form.indicaciones"
                        class="w-full rounded-lg border p-2"></textarea>
            </label>
          </div>

          <div class="flex gap-3">
            <button type="submit" [disabled]="ocupado"
                    class="rounded-lg bg-[#611232] px-5 py-2 font-semibold text-white">
              {{ ocupado ? "Guardando..." : "Guardar evento" }}
            </button>
            <button type="button" (click)="cancelar()" [disabled]="ocupado"
                    class="rounded-lg border px-5 py-2">Cancelar</button>
          </div>
        </form>
      </section>

      <section class="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div class="border-b p-4">
          <h2 class="text-lg font-bold text-[#611232]">Eventos registrados</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 text-gray-700">
              <tr>
                <th class="p-3">Evento</th>
                <th class="p-3">Fecha de inicio</th>
                <th class="p-3">Sede</th>
                <th class="p-3">Modalidad</th>
                <th class="p-3">Estado</th>
                <th class="p-3">Capacidad</th>
                <th class="p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let evento of eventos" class="border-t">
                <td class="p-3">
                  <strong>{{ evento.nombre }}</strong>
                  <p class="text-gray-500">{{ evento.tipo }}</p>
                </td>
                <td class="p-3">{{ evento.fecha_inicio | date:"dd/MM/yyyy HH:mm" }}</td>
                <td class="p-3">{{ evento.sede || "Sin especificar" }}</td>
                <td class="p-3">{{ evento.modalidad }}</td>
                <td class="p-3">{{ evento.estado }}</td>
                <td class="p-3">{{ evento.capacidad ?? "Sin límite definido" }}</td>
                <td class="p-3">
                  <a [routerLink]="['/eventos', evento.id_evento, 'inscripciones']"
                     data-testid="event-registrations-navigation"
                     class="mr-2 inline-block rounded-lg border border-[#611232] px-3 py-2 text-[#611232]">
                    Inscripciones
                  </a>                  <button type="button" (click)="editar(evento)"
                          [disabled]="ocupado || evento.estado === 'CERRADO' || evento.estado === 'CANCELADO'"
                          class="rounded-lg border px-3 py-2 text-[#611232] disabled:opacity-40">
                    Editar
                  </button>
                </td>
              </tr>
              <tr *ngIf="!ocupado && eventos.length === 0">
                <td colspan="7" class="p-6 text-center text-gray-500">
                  No hay eventos que coincidan con los filtros.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="flex items-center justify-between gap-3 border-t p-4">
          <span class="text-sm text-gray-600">
            {{ total }} eventos encontrados
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
export class EventManagementPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = "/api/eventos";

  eventos: Evento[] = [];
  buscar = "";
  filtroEstado = "";
  filtroModalidad = "";
  pagina = 1;
  paginas = 1;
  total = 0;
  ocupado = false;
  error = "";
  mensaje = "";
  mostrarFormulario = false;
  editandoId: string | null = null;
  form: FormularioEvento = this.formVacio();

  ngOnInit(): void {
    void this.cargar();
  }

  private formVacio(): FormularioEvento {
    return {
      nombre: "",
      tipo: "",
      tema_principal: "",
      sede: "",
      direccion: "",
      latitud: null,
      longitud: null,
      fecha_inicio: "",
      fecha_fin: "",
      capacidad: null,
      modalidad: "PRESENCIAL",
      indicaciones: "",
      estado: "PLANEADO",
    };
  }

  get estadosPermitidos(): EstadoEvento[] {
    switch (this.form.estado) {
      case "PLANEADO":
        return ["PLANEADO", "PUBLICADO", "CANCELADO"];
      case "PUBLICADO":
        return ["PUBLICADO", "EN_CURSO", "CANCELADO"];
      case "EN_CURSO":
        return ["EN_CURSO", "CERRADO", "CANCELADO"];
      default:
        return [this.form.estado];
    }
  }

  async cargar(pagina = 1): Promise<void> {
    if (this.ocupado) return;
    this.ocupado = true;
    this.error = "";

    try {
      let params = new HttpParams().set("page", String(pagina));
      if (this.buscar.trim()) params = params.set("buscar", this.buscar.trim());
      if (this.filtroEstado) params = params.set("estado", this.filtroEstado);
      if (this.filtroModalidad) params = params.set("modalidad", this.filtroModalidad);

      const result = await firstValueFrom(
        this.http.get<PaginaEventos>(this.api, { params }),
      );

      this.eventos = result.data;
      this.pagina = result.current_page;
      this.paginas = Math.max(result.last_page, 1);
      this.total = result.total;
    } catch {
      this.error = "No fue posible consultar los eventos. Verifique sus permisos.";
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }

  limpiarFiltros(): void {
    this.buscar = "";
    this.filtroEstado = "";
    this.filtroModalidad = "";
    void this.cargar(1);
  }

  nuevo(): void {
    this.editandoId = null;
    this.form = this.formVacio();
    this.mostrarFormulario = true;
    this.error = "";
    this.mensaje = "";
  }

  private fechaLocal(fecha: string): string {
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
  }

  editar(evento: Evento): void {
    if (evento.estado === "CERRADO" || evento.estado === "CANCELADO") return;

    this.editandoId = evento.id_evento;
    this.form = {
      nombre: evento.nombre,
      tipo: evento.tipo,
      tema_principal: evento.tema_principal,
      sede: evento.sede || "",
      direccion: evento.direccion || "",
      latitud: evento.latitud,
      longitud: evento.longitud,
      fecha_inicio: this.fechaLocal(evento.fecha_inicio),
      fecha_fin: this.fechaLocal(evento.fecha_fin),
      capacidad: evento.capacidad,
      modalidad: evento.modalidad,
      indicaciones: evento.indicaciones || "",
      estado: evento.estado,
    };
    this.mostrarFormulario = true;
    this.error = "";
    this.mensaje = "";
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.editandoId = null;
    this.error = "";
  }

  async guardar(): Promise<void> {
    if (this.ocupado) return;
    this.error = "";
    this.mensaje = "";

    const f = this.form;
    if (!f.nombre.trim() || !f.tipo.trim() || !f.tema_principal.trim()) {
      this.error = "Nombre, tipo y tema principal son obligatorios.";
      return;
    }

    const inicio = new Date(f.fecha_inicio);
    const fin = new Date(f.fecha_fin);
    if (!f.fecha_inicio || !f.fecha_fin ||
        Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) ||
        fin <= inicio) {
      this.error = "La fecha de finalización debe ser posterior al inicio.";
      return;
    }

    if ((f.latitud == null) !== (f.longitud == null)) {
      this.error = "Proporcione ambas coordenadas o deje las dos vacías.";
      return;
    }

    if (f.capacidad != null && (!Number.isInteger(f.capacidad) || f.capacidad < 1)) {
      this.error = "La capacidad debe ser un entero positivo.";
      return;
    }

    const payload = {
      nombre: f.nombre.trim(),
      tipo: f.tipo.trim(),
      tema_principal: f.tema_principal.trim(),
      sede: f.sede.trim() || null,
      direccion: f.direccion.trim() || null,
      latitud: f.latitud,
      longitud: f.longitud,
      fecha_inicio: inicio.toISOString(),
      fecha_fin: fin.toISOString(),
      capacidad: f.capacidad,
      modalidad: f.modalidad,
      indicaciones: f.indicaciones.trim() || null,
      ...(this.editandoId ? { estado: f.estado } : {}),
    };

    this.ocupado = true;
    try {
      if (this.editandoId) {
        await firstValueFrom(
          this.http.put(`${this.api}/${this.editandoId}`, payload),
        );
      } else {
        await firstValueFrom(this.http.post(this.api, payload));
      }
      this.mensaje = this.editandoId
        ? "Evento actualizado correctamente."
        : "Evento registrado correctamente.";
      this.editandoId = null;
      this.mostrarFormulario = false;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        const status = error.status;

        if (status === 422) {
          const validationErrors = error.error?.errors as
            | Record<string, string[]>
            | undefined;

          const details = validationErrors &&
            typeof validationErrors === "object"
            ? Object.values(validationErrors)
                .flat()
                .filter((message): message is string => typeof message === "string")
                .slice(0, 3)
            : [];

          this.error = details.length > 0
            ? `Datos no válidos: ${details.join(" ")}`
            : "El servidor rechazó los datos del evento (HTTP 422).";
        } else if (status === 401) {
          this.error = "La sesión no está autenticada (HTTP 401). Inicie sesión nuevamente.";
        } else if (status === 403) {
          this.error = "El servidor denegó esta operación (HTTP 403).";
        } else if (status === 419) {
          this.error = "La protección de sesión CSRF rechazó la solicitud (HTTP 419).";
        } else if (status === 0) {
          this.error = "No fue posible conectar con el servidor de SIGA.";
        } else {
          this.error = `No fue posible guardar el evento (HTTP ${status}).`;
        }
      } else {
        this.error = "No fue posible procesar el guardado del evento.";
      }
      return;
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }

    await this.cargar(1);
  }
}