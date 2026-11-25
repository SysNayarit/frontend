import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import * as QRCode from "qrcode";

interface UsuarioQR {
  id: number;
  name: string;
  roles: string[];
  uid_qr: string | null;
}

interface ListaQR {
  data: UsuarioQR[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

@Component({
  selector: "app-credential-qr-generator-page",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="mx-auto max-w-5xl space-y-5 p-5">

      <h1 class="text-2xl font-bold">
        Generador QR
      </h1>

      <p
        *ngIf="error"
        role="alert"
        class="rounded border p-3 text-red-700"
      >
        {{ error }}
      </p>

      <p *ngIf="ocupado">
        Procesando...
      </p>

      <div class="overflow-x-auto rounded-lg border">
        <table class="w-full text-left">

          <thead class="border-b bg-gray-100">
            <tr>
              <th class="p-3">Usuario</th>
              <th class="p-3">Roles</th>
              <th class="p-3">Acción</th>
            </tr>
          </thead>

          <tbody>
            <tr
              *ngFor="let usuario of usuarios"
              class="border-b"
            >
              <td class="p-3">
                {{ usuario.name }}
              </td>

              <td class="p-3">
                {{ usuario.roles.join(", ") || "Sin rol" }}
              </td>

              <td class="p-3">
                <button
                  type="button"
                  class="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
                  [disabled]="ocupado || usuario.roles.length === 0"
                  (click)="usuario.uid_qr ? descargar(usuario) : generar(usuario)"
                >
                  {{ usuario.uid_qr ? "Descargar" : "Generar" }}
                </button>
              </td>
            </tr>

            <tr *ngIf="!ocupado && usuarios.length === 0">
              <td colspan="3" class="p-4">
                No se encontraron usuarios.
              </td>
            </tr>
          </tbody>

        </table>
      </div>

      <div
        class="flex items-center gap-3"
        *ngIf="totalPaginas > 1"
      >
        <button
          type="button"
          [disabled]="ocupado || pagina <= 1"
          (click)="cargar(pagina - 1)"
        >
          Anterior
        </button>

        <span>
          Página {{ pagina }} de {{ totalPaginas }}
        </span>

        <button
          type="button"
          [disabled]="ocupado || pagina >= totalPaginas"
          (click)="cargar(pagina + 1)"
        >
          Siguiente
        </button>
      </div>

      <section
        *ngIf="imagen"
        class="rounded-lg border p-5 text-center"
      >
        <h2 class="font-semibold">
          QR: {{ nombreSeleccionado }}
        </h2>

        <img
          [src]="imagen"
          alt="Código QR institucional"
          width="320"
          height="320"
          class="mx-auto max-w-full"
        />

        <button
          type="button"
          class="rounded border px-4 py-2"
          (click)="descargarSeleccionado()"
        >
          Descargar PNG
        </button>
      </section>

    </section>
  `,
})
export class CredentialQrGeneratorPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  usuarios: UsuarioQR[] = [];
  ocupado = false;
  error = "";
  pagina = 1;
  totalPaginas = 1;

  imagen: string | null = null;
  nombreSeleccionado = "";
  usuarioSeleccionado: UsuarioQR | null = null;

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(pagina = 1): Promise<void> {
    this.ocupado = true;
    this.error = "";
    this.imagen = null;

    try {
      const response = await firstValueFrom(
        this.http.get<ListaQR>(
          `/api/qr/usuarios?page=${pagina}`
        )
      );

      this.usuarios = response.data;
      this.pagina = response.meta.current_page;
      this.totalPaginas = response.meta.last_page;

    } catch {
      this.error = "No fue posible consultar los usuarios.";

    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }

  async generar(usuario: UsuarioQR): Promise<void> {
    if (this.ocupado || usuario.uid_qr) return;

    this.ocupado = true;
    this.error = "";
    this.imagen = null;

    try {
      const response = await firstValueFrom(
        this.http.post<{ uid_qr: string }>(
          `/api/qr/usuarios/${usuario.id}/generar`,
          {}
        )
      );

      usuario.uid_qr = response.uid_qr;
      await this.mostrar(usuario);

    } catch {
      this.error = "No fue posible generar el QR.";

    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }

  async mostrar(usuario: UsuarioQR): Promise<void> {
    if (!usuario.uid_qr) return;

    const image = await QRCode.toDataURL(
      usuario.uid_qr,
      {
        errorCorrectionLevel: "M",
        margin: 3,
        width: 320,
      }
    );

    this.imagen = image;
    this.usuarioSeleccionado = usuario;
    this.nombreSeleccionado = usuario.name;

    this.cdr.markForCheck();
  }

  async descargar(usuario: UsuarioQR): Promise<void> {
    if (this.ocupado) return;

    this.error = "";

    try {
      await this.mostrar(usuario);
      this.descargarSeleccionado();

    } catch {
      this.error = "No fue posible descargar el QR.";
      this.cdr.markForCheck();
    }
  }

  descargarSeleccionado(): void {
    if (!this.imagen || !this.usuarioSeleccionado) return;

    const link = document.createElement("a");

    link.href = this.imagen;
    link.download = `SIGA-QR-${this.usuarioSeleccionado.id}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}