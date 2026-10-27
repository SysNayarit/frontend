import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";

@Component({
  selector: "app-users-pagination",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      aria-label="Paginación de usuarios"
      class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#98989a]/20 bg-white px-5 py-4"
    >
      <p class="text-sm text-[#555555]">
        Página
        <strong data-testid="current-page">{{ currentPage }}</strong>
        de
        <strong data-testid="last-page">{{ lastPage }}</strong>
        · {{ total }} usuarios registrados
      </p>

      <div class="flex items-center gap-2">
        <button
          type="button"
          data-testid="previous-page"
          class="siga-focus rounded-lg border border-[#98989a]/30 px-4 py-2 text-sm font-semibold text-[#611232] disabled:cursor-not-allowed disabled:opacity-40"
          [disabled]="disabled || currentPage <= 1"
          (click)="previous()"
        >
          Anterior
        </button>

        <button
          type="button"
          data-testid="next-page"
          class="siga-focus rounded-lg border border-[#98989a]/30 px-4 py-2 text-sm font-semibold text-[#611232] disabled:cursor-not-allowed disabled:opacity-40"
          [disabled]="disabled || currentPage >= lastPage"
          (click)="next()"
        >
          Siguiente
        </button>
      </div>
    </nav>
  `,
})
export class UsersPaginationComponent {
  @Input()
  currentPage = 1;

  @Input()
  lastPage = 1;

  @Input()
  total = 0;

  @Input()
  disabled = false;

  @Output()
  readonly pageChange = new EventEmitter<number>();

  previous(): void {
    if (this.disabled || this.currentPage <= 1) {
      return;
    }

    this.pageChange.emit(this.currentPage - 1);
  }

  next(): void {
    if (this.disabled || this.currentPage >= this.lastPage) {
      return;
    }

    this.pageChange.emit(this.currentPage + 1);
  }
}