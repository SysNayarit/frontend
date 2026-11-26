import { ChangeDetectionStrategy, Component } from "@angular/core";

import { CadetContextPageComponent } from "./cadet-context-page.component";
import { TeacherEvaluationPageComponent } from "./teacher-evaluation-page.component";

@Component({
  selector: "app-cadet-context-evaluation-page",
  standalone: true,
  imports: [
    CadetContextPageComponent,
    TeacherEvaluationPageComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-cadet-context-page />

    <section
      aria-label="Evaluación docente del contexto académico"
      data-testid="cadet-context-evaluation"
      class="mt-6"
    >
      <app-teacher-evaluation-page />
    </section>
  `,
})
export class CadetContextEvaluationPageComponent {}