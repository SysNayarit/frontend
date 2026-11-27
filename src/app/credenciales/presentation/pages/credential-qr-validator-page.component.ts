import { CommonModule } from "@angular/common";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { finalize, of, switchMap, take } from "rxjs";
import jsQR from "jsqr";

interface LecturaGuardadaQR {
  id: number;
  usuario: string;
  operador: string;
  fecha_hora: string;
  dispositivo: string;
  latitud: number | null;
  longitud: number | null;
}

interface RespuestaBitacoraQR {
  data: LecturaGuardadaQR[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}
interface CredentialQrValidationResponse {
  valida: boolean;
  tipo?: "EVENTO" | "CREDENCIAL_INSTITUCIONAL";
  credencial?: {
    categoria: string;
    estado: string;
  };
  evento?: {
    nombre: string;
    estado: string;
    id_evento: string;
    id_inscripcion: string;
  };
  usuario?: {
    id: number;
    nombre: string;
    roles: string[];
  };
  fecha_hora?: string;
  dispositivo?: string;
  ubicacion?: {
    latitud: number | null;
    longitud: number | null;
  };
}

interface NativeBarcodeDetector {
  detect(source: HTMLVideoElement): Promise<ReadonlyArray<{ rawValue: string }>>;
}

type NativeBarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => NativeBarcodeDetector;

type ValidationState =
  | "inicial"
  | "valida"
  | "invalida"
  | "no-autorizada"
  | "limite"
  | "error";

@Component({
  selector: "app-credential-qr-validator-page",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="credential-qr-page">
      <header>
        <h1>Validación de credenciales institucionales</h1>
        <p>
          Compruebe la vigencia de una credencial SIGA
          mediante su identificador QR.
        </p>
      </header>

      <div class="validation-panel">
        <h2>Lectura mediante cámara</h2>

        <p>
          La cámara únicamente se activa cuando usted lo solicita.
          Se detiene al identificar el QR, al cerrar el lector
          o al salir de esta pantalla.
        </p>

        <div class="camera-actions">
          <button
            type="button"
            [disabled]="camaraActiva || iniciandoCamara || consultando"
            (click)="iniciarCamara()"
          >
            {{ iniciandoCamara ? "Activando cámara..." : "Activar cámara" }}
          </button>

          <button
            *ngIf="camaraActiva"
            type="button"
            class="secondary-button"
            (click)="detenerCamara()"
          >
            Detener cámara
          </button>
        </div>

        <div class="qr-camera-stage">
          <video
            #qrCamera
            class="qr-camera-live"
            autoplay
            playsinline
            muted
            aria-label="Video en vivo para lectura de QR"
          ></video>

          <div
            *ngIf="camaraActiva"
            class="qr-camera-overlay"
            aria-hidden="true"
          >
            <div class="qr-camera-frame">
              <span class="qr-corner top-left"></span>
              <span class="qr-corner top-right"></span>
              <span class="qr-corner bottom-left"></span>
              <span class="qr-corner bottom-right"></span>
            </div>

            <p class="qr-camera-instruction">
              Coloque el QR dentro del recuadro
            </p>
          </div>

          <div
            *ngIf="!camaraActiva"
            class="qr-camera-placeholder"
          >
            <span>Visor de cámara</span>
            <small>Pulse Activar cámara para ver la imagen en vivo.</small>
          </div>
        </div>

        <p
          *ngIf="mensajeCamara"
          class="camera-message"
          role="status"
        >
          {{ mensajeCamara }}
        </p>

<p
          *ngIf="estado === 'valida' && tipoLectura === 'USUARIO'"
          class="result success"
          role="status"
        >
          QR de Usuario válido.
        </p>
        <section
          *ngIf="estado === 'valida' && tipoLectura === 'CREDENCIAL_INSTITUCIONAL' && credencialLeida"
          class="qr-read-history"
          role="status"
        >
          <h2>Credencial institucional válida</h2>
          <p><strong>Categoría:</strong> {{ credencialLeida.categoria }}</p>
          <p><strong>Estado:</strong> {{ credencialLeida.estado }}</p>
        </section>
        <section *ngIf="estado === 'valida' && tipoLectura === 'EVENTO' && eventoLeido"
                 class="qr-read-history" role="status">
          <h2>Inscripción de evento válida</h2>
          <p><strong>Evento:</strong> {{ eventoLeido.nombre }}</p>
          <p>Inscripción confirmada y QR vigente.</p>
          <p>Esta lectura no registra asistencia automáticamente.</p>

          <button
            type="button"
            [disabled]="registrandoEntradaEvento || entradaEventoRegistrada"
            (click)="registrarEntradaEvento()">
            {{ registrandoEntradaEvento ? 'Registrando...' :
               entradaEventoRegistrada ? 'Entrada registrada' :
               'Registrar entrada' }}
          </button>

          <p *ngIf="mensajeEntradaEvento" role="status">
            {{ mensajeEntradaEvento }}
          </p>
        </section>

        <p
          *ngIf="estado === 'invalida'"
          class="result invalid"
          role="status"
        >
          Credencial inválida, revocada, vencida o no reconocida.
        </p>

        <p
          *ngIf="estado === 'no-autorizada'"
          class="result warning"
          role="alert"
        >
          No tiene una sesión válida o permisos para esta operación.
        </p>

        <p
          *ngIf="estado === 'limite'"
          class="result warning"
          role="alert"
        >
          Se alcanzó el límite de consultas. Inténtelo más tarde.
        </p>

        <p
          *ngIf="estado === 'error'"
          class="result warning"
          role="alert"
        >
          No se pudo completar la consulta de validación.
        </p>

        <section class="qr-read-history">
          <h2>Lecturas de esta sesión: {{ conteoLecturas }}</h2>

          <div *ngIf="usuarioLeido">
            <strong>Último usuario leído:</strong>
            {{ usuarioLeido }}
            <p>Roles: {{ rolesLeidos.join(", ") }}</p>
          </div>

          <div *ngFor="let lectura of historialLecturas"
               class="qr-read-item">
            <strong>{{ lectura.usuario }}</strong>
            <p>Fecha y hora: {{ lectura.fecha }}</p>
            <p>Dispositivo: {{ lectura.dispositivo }}</p>
            <p>Ubicación: {{ lectura.ubicacion }}</p>
          </div>
        </section>
        <section class="qr-read-history">
          <h2>Bitácora de lecturas guardadas</h2>

          <p>Total registrado por este operador: {{ totalGuardado }}</p>

          <p *ngIf="errorBitacora" role="alert">
            {{ errorBitacora }}
          </p>

          <div *ngFor="let lectura of historialGuardado"
               class="qr-read-item">
            <strong>{{ lectura.usuario }}</strong>

            <p>Fecha y hora:
              {{ lectura.fecha_hora | date:"dd/MM/yyyy HH:mm:ss" }}
            </p>

            <p>Operador: {{ lectura.operador }}</p>
            <p>Dispositivo: {{ lectura.dispositivo }}</p>

            <p *ngIf="lectura.latitud != null && lectura.longitud != null">
              Ubicación: {{ lectura.latitud }}, {{ lectura.longitud }}
            </p>

            <p *ngIf="lectura.latitud == null || lectura.longitud == null">
              Ubicación: no disponible
            </p>
          </div>

          <p *ngIf="!cargandoBitacora && historialGuardado.length === 0">
            No hay lecturas registradas para este operador.
          </p>

          <div *ngIf="paginasGuardadas > 1">
            <button type="button"
                    [disabled]="cargandoBitacora || paginaGuardada <= 1"
                    (click)="cargarBitacora(paginaGuardada - 1)">
              Anterior
            </button>

            <span>
              Página {{ paginaGuardada }} de {{ paginasGuardadas }}
            </span>

            <button type="button"
                    [disabled]="cargandoBitacora || paginaGuardada >= paginasGuardadas"
                    (click)="cargarBitacora(paginaGuardada + 1)">
              Siguiente
            </button>
          </div>
        </section>
        <p class="privacy-note">
          La identidad mostrada corresponde a una lectura autorizada.
          La bitácora registra fecha, hora, usuario y dispositivo.
          La ubicación solo se registra si el navegador la permite.
        </p>
      </div>
    </section>
  `,
  styles: [`
    .credential-qr-page {
      max-width: 780px;
      margin: 0 auto;
      padding: 2rem 1.25rem;
    }

    h1 {
      margin: 0 0 0.75rem;
      font-size: 1.75rem;
    }

    h2 {
      margin: 0.5rem 0 0;
      font-size: 1.15rem;
    }

    header p,
    .validation-panel > p {
      line-height: 1.5;
    }

    header p {
      margin-bottom: 1.5rem;
    }

    .validation-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.75rem;
    }

    .camera-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    video {
      display: block;
      width: 100%;
      max-height: 380px;
      background: #0f172a;
      border-radius: 0.6rem;
      object-fit: contain;
    }

    video[hidden] {
      display: none;
    }

    /* SIGA-C2: visor institucional de QR */
    .qr-camera-stage {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
      max-height: 65vh;
      overflow: hidden;
      box-sizing: border-box;
      border: 2px solid #64748b;
      border-radius: 0.75rem;
      background: #0f172a;
    }

    .qr-camera-live {
      display: block;
      width: 100%;
      height: 100%;
      max-height: none;
      object-fit: cover;
      background: #0f172a;
    }

    .qr-camera-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .qr-camera-frame {
      position: relative;
      width: min(60%, 270px);
      aspect-ratio: 1;
      box-sizing: border-box;
      border: 2px solid rgba(255, 255, 255, 0.65);
      border-radius: 0.75rem;
      box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.16);
    }

    .qr-corner {
      position: absolute;
      width: 32px;
      height: 32px;
      box-sizing: border-box;
      border: 0 solid #22c55e;
    }

    .qr-corner.top-left {
      top: -3px;
      left: -3px;
      border-top-width: 5px;
      border-left-width: 5px;
      border-top-left-radius: 10px;
    }

    .qr-corner.top-right {
      top: -3px;
      right: -3px;
      border-top-width: 5px;
      border-right-width: 5px;
      border-top-right-radius: 10px;
    }

    .qr-corner.bottom-left {
      bottom: -3px;
      left: -3px;
      border-bottom-width: 5px;
      border-left-width: 5px;
      border-bottom-left-radius: 10px;
    }

    .qr-corner.bottom-right {
      bottom: -3px;
      right: -3px;
      border-bottom-width: 5px;
      border-right-width: 5px;
      border-bottom-right-radius: 10px;
    }

    .qr-camera-instruction {
      position: absolute;
      left: 50%;
      bottom: 0.75rem;
      transform: translateX(-50%);
      width: calc(100% - 2rem);
      max-width: 500px;
      box-sizing: border-box;
      margin: 0;
      padding: 0.65rem;
      border-radius: 0.5rem;
      background: rgba(15, 23, 42, 0.85);
      color: #fff;
      text-align: center;
      font-weight: 600;
      line-height: 1.4;
    }

    .qr-camera-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      box-sizing: border-box;
      background: #0f172a;
      color: #fff;
      text-align: center;
    }

    .qr-camera-placeholder span {
      font-weight: 700;
    }

    .qr-camera-placeholder small {
      color: #cbd5e1;
    }

    @media (max-width: 480px) {
      .qr-camera-stage {
        aspect-ratio: 3 / 4;
      }

      .qr-camera-frame {
        width: min(70%, 240px);
      }

      .qr-camera-instruction {
        font-size: 0.85rem;
      }
    }

    label {
      font-weight: 600;
    }

    input {
      box-sizing: border-box;
      width: 100%;
      padding: 0.8rem;
      border: 1px solid #94a3b8;
      border-radius: 0.4rem;
      font: inherit;
    }

    button {
      align-self: flex-start;
      padding: 0.8rem 1.25rem;
      border: 0;
      border-radius: 0.4rem;
      background: #174a78;
      color: white;
      font: inherit;
      cursor: pointer;
    }

    .secondary-button {
      background: #475569;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .camera-message {
      margin: 0;
      color: #334155;
    }

    .result {
      margin: 0;
      padding: 1rem;
      border-radius: 0.4rem;
      font-weight: 600;
    }

    .success {
      background: #dcfce7;
      color: #14532d;
    }

    .invalid {
      background: #fee2e2;
      color: #7f1d1d;
    }

    .warning {
      background: #fef3c7;
      color: #78350f;
    }

    .privacy-note {
      font-size: 0.875rem;
      line-height: 1.5;
      opacity: 0.8;
    }
  `],
})
export class CredentialQrValidatorPageComponent implements OnDestroy, OnInit {
  @ViewChild("qrCamera", { static: true })
  private cameraElement?: ElementRef<HTMLVideoElement>;

  private readonly http = inject(HttpClient);
  private readonly changeDetector = inject(ChangeDetectorRef);

  private stream: MediaStream | null = null;
  private detector: NativeBarcodeDetector | null = null;
  private qrCanvas: HTMLCanvasElement | null = null;
  private frameId: number | null = null;
  private scanInProgress = false;
  private destroyed = false;

  // SIGA_C2_LECTURA_CONTINUA
  conteoLecturas = 0;
  usuarioLeido = "";
  rolesLeidos: string[] = [];
  historialLecturas: Array<{
    usuario: string;
    fecha: string;
    dispositivo: string;
    ubicacion: string;
  }> = [];

  private ultimasLecturas = new Map<string, number>();
  private latitud: number | null = null;
  private longitud: number | null = null;
  private geoWatchId: number | null = null;
  historialGuardado: LecturaGuardadaQR[] = [];
  totalGuardado = 0;
  paginaGuardada = 1;
  paginasGuardadas = 1;
  cargandoBitacora = false;
  errorBitacora = "";
  qrUid = "";
  consultando = false;
  camaraActiva = false;
  iniciandoCamara = false;
  mensajeCamara = "";
  estado: ValidationState = "inicial";
  tipoLectura: "USUARIO" | "CREDENCIAL_INSTITUCIONAL" | "EVENTO" | null = null;
  credencialLeida: {
    categoria: string;
    estado: string;
  } | null = null;
  eventoLeido: {
    nombre: string;
    id_inscripcion: string;
  } | null = null;


  registrandoEntradaEvento = false;
  entradaEventoRegistrada = false;
  mensajeEntradaEvento = "";
  ngOnInit(): void {
    this.cargarBitacora(1);
  }

  cargarBitacora(pagina = 1): void {
    if (this.cargandoBitacora || this.destroyed) {
      return;
    }

    this.cargandoBitacora = true;
    this.errorBitacora = "";

    this.http.get<RespuestaBitacoraQR>(
      `/api/credenciales/qr/bitacora?page=${pagina}`,
    ).pipe(
      take(1),
      finalize(() => {
        this.cargandoBitacora = false;
        if (!this.destroyed) {
          this.changeDetector.detectChanges();
        }
      }),
    ).subscribe({
      next: (respuesta) => {
        if (this.destroyed) {
          return;
        }

        this.historialGuardado = respuesta.data;
        this.totalGuardado = respuesta.meta.total;
        this.paginaGuardada = respuesta.meta.current_page;
        this.paginasGuardadas = respuesta.meta.last_page;
        this.changeDetector.detectChanges();
      },
      error: () => {
        if (this.destroyed) {
          return;
        }

        this.errorBitacora =
          "No fue posible consultar la bitácora guardada.";
        this.changeDetector.detectChanges();
      },
    });
  }
  async iniciarCamara(): Promise<void> {
    if (
      this.camaraActiva ||
      this.iniciandoCamara ||
      this.consultando ||
      this.destroyed
    ) {
      return;
    }

    this.mensajeCamara = "";

    const api = globalThis as typeof globalThis & {
      BarcodeDetector?: NativeBarcodeDetectorConstructor;
    };


    if (!navigator.mediaDevices?.getUserMedia) {
      this.mensajeCamara =
        "La cámara no está disponible. Use HTTPS o localhost y revise los permisos del navegador.";
      return;
    }

    const video = this.cameraElement?.nativeElement;

    if (!video) {
      this.mensajeCamara = "No se encontró la vista previa de cámara.";
      return;
    }

    this.iniciandoCamara = true;

    try {
      let detector: NativeBarcodeDetector | null = null;

      if (api.BarcodeDetector) {
        try {
          detector = new api.BarcodeDetector({ formats: ["qr_code"] });
        } catch {
          detector = null;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
        },
      });

      if (this.destroyed) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      this.detector = detector;
      this.stream = stream;

      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.srcObject = stream;

      this.camaraActiva = true;
      // Ubicacion opcional, autorizada por el navegador.
      if (navigator.geolocation) {
        this.geoWatchId = navigator.geolocation.watchPosition(
          (posicion) => {
            this.latitud = posicion.coords.latitude;
            this.longitud = posicion.coords.longitude;
          },
          () => {
            this.latitud = null;
            this.longitud = null;
          },
          {
            enableHighAccuracy: false,
            maximumAge: 15000,
            timeout: 10000,
          },
        );
      }

      // Actualizar inmediatamente la interfaz para retirar
      // la capa de espera antes de reproducir el video.
      this.changeDetector.detectChanges();

      await video.play();

      // Confirmar que el video recibe fotogramas reales.
      if (
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => {
            limpiar();
            reject(new Error("CAMARA_SIN_FOTOGRAMAS"));
          }, 7000);

          const limpiar = () => {
            window.clearTimeout(timeout);
            video.removeEventListener("loadeddata", comprobar);
            video.removeEventListener("error", fallo);
          };

          const comprobar = () => {
            if (
              video.readyState >= 2 &&
              video.videoWidth > 0 &&
              video.videoHeight > 0
            ) {
              limpiar();
              resolve();
            }
          };

          const fallo = () => {
            limpiar();
            reject(new Error("ERROR_EN_ELEMENTO_VIDEO"));
          };

          video.addEventListener("loadeddata", comprobar);
          video.addEventListener("error", fallo);
          comprobar();
        });
      }

      if (!this.destroyed && this.camaraActiva) {
        this.mensajeCamara =
          "Cámara activa. Coloque el código QR dentro de la imagen.";
        this.frameId = requestAnimationFrame(
          () => void this.escanearFotograma(),
        );
      }
    } catch (error) {
      const detalle = error instanceof Error
        ? `${error.name}: ${error.message}`
        : "ERROR_DESCONOCIDO";

      this.detenerCamara();

      if (!this.destroyed) {
        this.mensajeCamara =
          `No fue posible mostrar el video de la camara. Detalle: ${detalle}`;
      }
    } finally {
      this.iniciandoCamara = false;

      if (!this.destroyed) {
        this.changeDetector.detectChanges();
      }
    }
  }

  detenerCamara(): void {
    this.camaraActiva = false;

    if (this.geoWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geoWatchId);
      this.geoWatchId = null;
    }

    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    const video = this.cameraElement?.nativeElement;

    if (video) {
      video.pause();
      video.srcObject = null;
    }

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.detector = null;
    this.qrCanvas = null;
  }

  private async escanearFotograma(): Promise<void> {
    if (
      !this.camaraActiva ||
      this.scanInProgress ||
      this.destroyed
    ) {
      return;
    }

    const video = this.cameraElement?.nativeElement;

    if (!video) {
      this.detenerCamara();
      return;
    }

    this.scanInProgress = true;
    let resultado: string | null = null;

    try {
      let detecciones: ReadonlyArray<{ rawValue: string }> = [];

      if (this.detector) {
        try {
          detecciones = await this.detector.detect(video);
        } catch {
          this.detector = null;
        }
      }

      if (detecciones.length === 0) {
        const contenido = this.decodificarFotograma(video);

        if (contenido) {
          detecciones = [{ rawValue: contenido }];
        }
      }

      if (!this.destroyed && this.camaraActiva) {
        for (const deteccion of detecciones) {
          const uid = this.extraerUid(deteccion.rawValue);

          if (uid) {
            resultado = uid;
            break;
          }

          // El QR fue decodificado, pero no contiene un UID
          // institucional aceptado. No exponer su contenido.
          if (
            this.mensajeCamara !==
            "QR detectado, pero no corresponde a una credencial SIGA."
          ) {
            this.mensajeCamara =
              "QR detectado, pero no corresponde a una credencial SIGA.";
            this.changeDetector.detectChanges();
          }
        }
      }
    } catch {
      this.detenerCamara();

      if (!this.destroyed) {
        this.mensajeCamara =
          "Ocurrió un error al leer la imagen. Puede validar manualmente.";
      }
    } finally {
      this.scanInProgress = false;
    }

    if (resultado && !this.destroyed && this.camaraActiva) {
      const ahora = Date.now();
      const ultima = this.ultimasLecturas.get(resultado) ?? 0;

      // El mismo QR no se cuenta otra vez inmediatamente.
      if (!this.consultando && ahora - ultima >= 5000) {
        this.ultimasLecturas.set(resultado, ahora);
        this.qrUid = resultado;
        this.mensajeCamara = "QR identificado. Consultando SIGA.";
        this.validar();
      }
    }

    if (!this.destroyed && this.camaraActiva) {
      this.frameId = requestAnimationFrame(
        () => void this.escanearFotograma(),
      );
    }
  }

  private decodificarFotograma(video: HTMLVideoElement): string | null {
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (width <= 0 || height <= 0) {
      return null;
    }

    const canvas = this.qrCanvas ?? document.createElement("canvas");
    this.qrCanvas = canvas;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!context) {
      return null;
    }

    context.drawImage(video, 0, 0, width, height);

    const image = context.getImageData(0, 0, width, height);

    const resultado = jsQR(
      image.data,
      image.width,
      image.height,
      { inversionAttempts: "attemptBoth" },
    );

    return resultado?.data ?? null;
  }

  private extraerUid(raw: string): string | null {
    const uuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const contenido = raw.trim();

    if (uuid.test(contenido)) {
      return contenido;
    }

    try {
      const url = new URL(contenido);

      if (url.protocol !== "https:") {
        return null;
      }

      const parametro = url.searchParams.get("uid_qr");

      if (parametro && uuid.test(parametro)) {
        return parametro;
      }

      const ultimoSegmento = url.pathname
        .split("/")
        .filter(Boolean)
        .pop();

      return ultimoSegmento && uuid.test(ultimoSegmento)
        ? ultimoSegmento
        : null;
    } catch {
      return null;
    }
  }

  registrarEntradaEvento(): void {
    if (
      this.registrandoEntradaEvento ||
      this.entradaEventoRegistrada ||
      this.consultando ||
      this.estado !== "valida" ||
      this.tipoLectura !== "EVENTO" ||
      !this.eventoLeido
    ) {
      return;
    }

    const uid = this.qrUid.trim();

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
      this.mensajeEntradaEvento = "El identificador QR no es válido.";
      return;
    }

    this.registrandoEntradaEvento = true;
    this.mensajeEntradaEvento = "";

    this.http.post<{
      registrada: boolean;
      ya_registrada: boolean;
      message: string;
    }>("/api/eventos/qr/registrar-entrada", {
      uid_qr: uid,
    }).pipe(
      take(1),
      finalize(() => {
        this.registrandoEntradaEvento = false;
        if (!this.destroyed) {
          this.changeDetector.detectChanges();
        }
      }),
    ).subscribe({
      next: (response) => {
        if (response.registrada === true) {
          this.entradaEventoRegistrada = true;
          this.mensajeEntradaEvento = "Entrada registrada correctamente.";
        } else {
          this.mensajeEntradaEvento =
            "No se confirmó el registro de entrada.";
        }
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 409) {
            this.entradaEventoRegistrada = true;
            this.mensajeEntradaEvento =
              "La entrada ya estaba registrada.";
            return;
          }

          if (error.status === 401 || error.status === 403) {
            this.mensajeEntradaEvento =
              "No tiene autorización para registrar entradas.";
            return;
          }

          if (error.status === 422) {
            this.mensajeEntradaEvento =
              "El QR ya no cumple las condiciones para registrar entrada.";
            return;
          }

          if (error.status === 429) {
            this.mensajeEntradaEvento =
              "Límite de solicitudes alcanzado.";
            return;
          }
        }

        this.mensajeEntradaEvento =
          "No se pudo completar el registro de entrada.";
      },
    });
  }
  validar(): void {
    if (this.consultando || this.destroyed) {
      return;
    }

    const uid = this.qrUid.trim();

    // Evitar datos residuales de una lectura anterior.
    this.tipoLectura = null;
    this.eventoLeido = null;
    this.credencialLeida = null;
    this.usuarioLeido = "";
    this.rolesLeidos = [];
    this.entradaEventoRegistrada = false;
    this.mensajeEntradaEvento = "";

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
      this.estado = "invalida";
      return;
    }



    this.consultando = true;
    this.estado = "inicial";
    this.entradaEventoRegistrada = false;
    this.mensajeEntradaEvento = "";

    this.http.post<CredentialQrValidationResponse>(
      "/api/credenciales/qr/validar",
      { uid_qr: uid, latitud: this.latitud, longitud: this.longitud },
    ).pipe(
      take(1),
      switchMap((response) => {
        if (response.valida) {
          return of(response);
        }

        return this.http.post<CredentialQrValidationResponse>(
          "/api/credenciales/institucionales/qr/validar",
          { uid_qr: uid },
        ).pipe(
          switchMap((credentialResponse) => {
            if (credentialResponse.valida) {
              return of(credentialResponse);
            }

            return this.http.post<CredentialQrValidationResponse>(
          "/api/eventos/qr/validar",
          { uid_qr: uid },
        )
          }),
        );
      }),
      finalize(() => {
        this.consultando = false;
      }),
    ).subscribe({
      next: (response) => {
        if (typeof response?.valida !== "boolean") {
          this.estado = "error";
          return;
        }

        this.tipoLectura = !response.valida
          ? null
          : response.tipo === "EVENTO" && response.evento
            ? "EVENTO"
            : response.tipo === "CREDENCIAL_INSTITUCIONAL" &&
                response.credencial?.estado === "VIGENTE"
              ? "CREDENCIAL_INSTITUCIONAL"
              : response.usuario
                ? "USUARIO"
                : null;

        this.eventoLeido = this.tipoLectura === "EVENTO"
          ? (response.evento ?? null)
          : null;

        this.credencialLeida =
          this.tipoLectura === "CREDENCIAL_INSTITUCIONAL"
            ? (response.credencial ?? null)
            : null;

        this.estado = this.tipoLectura ? "valida" : "invalida";

        if (response.valida && response.usuario) {
          this.conteoLecturas++;
          this.usuarioLeido = response.usuario.nombre;
          this.rolesLeidos = response.usuario.roles;

          const ubicacion = response.ubicacion;
          const geo = ubicacion?.latitud != null &&
                      ubicacion?.longitud != null
            ? `${ubicacion.latitud}, ${ubicacion.longitud}`
            : "No disponible";

          this.historialLecturas.unshift({
            usuario: response.usuario.nombre,
            fecha: response.fecha_hora
              ? new Date(response.fecha_hora).toLocaleString("es-MX")
              : new Date().toLocaleString("es-MX"),
            dispositivo: response.dispositivo || "No identificado",
            ubicacion: geo,
          });

          // El historial completo queda en PostgreSQL.
          // En pantalla se muestran las ultimas 20 lecturas.
          this.historialLecturas =
            this.historialLecturas.slice(0, 20);
          this.cargarBitacora(1);
        }

        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401 || error.status === 403) {
            this.estado = "no-autorizada";
            return;
          }

          if (error.status === 429) {
            this.estado = "limite";
            return;
          }
        }

        this.estado = "error";
      },
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.detenerCamara();
  }
}