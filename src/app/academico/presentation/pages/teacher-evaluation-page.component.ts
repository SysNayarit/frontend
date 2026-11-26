import { HttpClient } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

interface Question {
  numero: number;
  texto: string;
}

interface Questionnaire {
  codigo: string;
  version: number;
  titulo: string;
  instrucciones: string;
  escala: {
    minimo: number;
    maximo: number;
    etiqueta_minimo: string;
    etiqueta_maximo: string;
  };
  preguntas: Question[];
  comentarios: {
    titulo: string;
    opcional: boolean;
  };
  envio_habilitado: boolean;
}

@Component({
  selector: "app-teacher-evaluation-page",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6" data-testid="teacher-evaluation-page">
      <header class="rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="text-3xl font-bold text-[#611232]">
          Evaluación Docente
        </h2>
      </header>

      @if (loading()) {
        <p role="status">Cargando cuestionario...</p>
      } @else if (error()) {
        <p role="alert" class="text-red-700">{{ error() }}</p>
      } @else if (questionnaire(); as form) {
        <section class="rounded-2xl border bg-white p-5">
          <h2 class="font-semibold text-[#611232]">
            Instrucciones
          </h2>
          <p class="mt-2 text-sm">{{ form.instrucciones }}</p>
          <p class="mt-2 text-xs text-gray-500">
            Versión {{ form.version }}
          </p>

          @if (!form.envio_habilitado) {
            <p
              role="status"
              data-testid="teacher-evaluation-not-eligible"
              class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
            >
              El envío permanecerá deshabilitado hasta comprobar
              una asignación docente real y un periodo autorizado.
            </p>
          }
        </section>

        @for (question of form.preguntas; track question.numero) {
          <fieldset class="rounded-2xl border bg-white p-5">
            <legend class="px-1 font-semibold text-[#611232]">
              {{ question.numero }}. {{ question.texto }}
            </legend>

            <div class="mt-4 flex flex-wrap gap-3">
              @for (value of scaleValues; track value) {
                <label class="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <input
                    type="radio"
                    [name]="'pregunta-' + question.numero"
                    [value]="value"
                    [checked]="answers()[question.numero] === value"
                    (change)="setAnswer(question.numero, value)"
                  />
                  {{ value }}
                </label>
              }
            </div>

            <div class="mt-2 flex justify-between text-xs text-gray-500">
              <span>1 (Malo)</span>
              <span>5 (Excelente)</span>
            </div>
          </fieldset>
        }

        <section class="rounded-2xl border bg-white p-5">
          <label
            for="teacher-evaluation-comments"
            class="block font-semibold text-[#611232]"
          >
            Comentarios Generales (Opcional)
          </label>

          <textarea
            id="teacher-evaluation-comments"
            rows="5"
            maxlength="2000"
            [value]="comments()"
            (input)="setComments($event)"
            class="mt-3 w-full rounded-lg border p-3"
          ></textarea>

          <p data-testid="teacher-evaluation-answer-count" role="status" class="mt-3 text-sm">
            Preguntas respondidas:
            {{ answeredCount() }} de {{ form.preguntas.length }}
          </p>

          <button
            type="button"
            disabled
            aria-disabled="true"
            data-testid="teacher-evaluation-submit"
            class="mt-4 rounded-lg bg-[#611232] px-5 py-3 font-semibold text-white opacity-40"
          >
            Finalizar y Enviar Evaluación
          </button>
        </section>
      }
    </section>
  `,
})
export class TeacherEvaluationPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly questionnaire = signal<Questionnaire | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly answers = signal<Record<number, number>>({});
  readonly comments = signal("");
  readonly scaleValues = [1, 2, 3, 4, 5];

  readonly answeredCount = computed(
    () => Object.keys(this.answers()).length
  );

  ngOnInit(): void {
    this.http.get<{ data: Questionnaire }>(
      "/api/academico/evaluacion-docente/cuestionario"
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        const form = response.data;

        if (
          !form ||
          form.codigo !== "EVALUACION_DOCENTE" ||
          form.preguntas?.length !== 21 ||
          form.escala?.minimo !== 1 ||
          form.escala?.maximo !== 5
        ) {
          this.error.set("Cuestionario institucional inválido.");
        } else {
          this.questionnaire.set(form);
        }

        this.loading.set(false);
      },
      error: () => {
        this.error.set("No se pudo consultar el cuestionario.");
        this.loading.set(false);
      },
    });
  }

  setAnswer(questionNumber: number, value: number): void {
    if (
      !Number.isInteger(questionNumber) ||
      questionNumber < 1 ||
      questionNumber > 21 ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 5
    ) {
      return;
    }

    this.answers.update(current => ({
      ...current,
      [questionNumber]: value,
    }));
  }

  setComments(event: Event): void {
    this.comments.set(
      (event.target as HTMLTextAreaElement).value
    );
  }
}