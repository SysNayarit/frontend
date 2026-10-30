import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  DestroyRef,
  ElementRef,
  inject,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
  Output,
  ViewChild,
} from "@angular/core";

import { Subscription } from "rxjs";

import { UserRole } from "../../../user-role.models";
import { UserRoleReauthenticationForm } from "../../forms/user-role-reauthentication-form";
import { UserRoleReauthenticationFieldComponent } from "../../molecules/user-role-reauthentication-field/user-role-reauthentication-field.component";

export type BulkRoleOperation = "assign" | "remove";

@Component({
  selector: "app-bulk-role-confirmation",
  standalone: true,
  imports: [UserRoleReauthenticationFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="
        operation === 'remove'
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          : ''
      "
    >
      <div
        #dialogPanel
        data-testid="bulk-page-confirmation"
        [attr.data-dialog]="
          operation === 'remove' ? 'bulk-removal-dialog' : null
        "
        [attr.role]="operation === 'remove' ? 'dialog' : null"
        [attr.aria-modal]="operation === 'remove' ? 'true' : null"
        [attr.aria-label]="
          operation === 'remove' ? 'Confirmar retirada de rol' : null
        "
        [class]="
          operation === 'remove'
            ? 'w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[#e7e2e3] bg-white p-6 shadow-xl'
            : 'space-y-4 border-t border-[#e7e2e3] pt-4'
        "
      >
        <h3 class="text-sm font-semibold text-[#611232]">
          Confirmación administrativa
        </h3>

        <p class="text-sm text-gray-600">
          Confirma tu contraseña administrativa para solicitar a Laravel
          {{ operation === "assign" ? "la asignación" : "la retirada" }}
          del rol seleccionado a {{ selectedCount }} usuarios.
        </p>

        <app-user-role-reauthentication-field
          [form]="form"
          [passwordError]="passwordError"
        />

        @if (role.code === "ROL_ADMIN_SISTEMA") {
          <p role="alert" class="text-sm text-red-700">
            Este rol administrativo está protegido.
          </p>
        }

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            [attr.data-testid]="
              operation === 'assign'
                ? 'bulk-page-confirm-assignment'
                : 'bulk-page-confirm-removal'
            "
            [disabled]="
              processing ||
              formInvalid() ||
              selectedCount < 1 ||
              selectedCount > 100 ||
              role.code === 'ROL_ADMIN_SISTEMA'
            "
            (click)="confirmOperation()"
            class="siga-focus rounded-lg bg-[#611232] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {{
              processing
                ? "Procesando..."
                : operation === "assign"
                  ? "Confirmar asignación"
                  : "Confirmar retirada"
            }}
          </button>

          <button
            type="button"
            data-testid="bulk-page-cancel-confirmation"
            [disabled]="processing"
            (click)="cancel.emit()"
            class="siga-focus rounded-lg border border-[#ddd3d7] px-4 py-2 text-sm text-[#611232] disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class BulkRoleConfirmationComponent implements OnChanges, AfterViewInit {
  @ViewChild("dialogPanel")
  private dialogPanel?: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.focusRemovalPassword();
  }

  private focusRemovalPassword(): void {
    if (this.operation !== "remove") return;

    this.dialogPanel?.nativeElement
      .querySelector<HTMLInputElement>('input[type="password"]')
      ?.focus();
  }

  @HostListener("document:keydown", ["$event"])
  handleDialogKeydown(event: KeyboardEvent): void {
    if (this.operation !== "remove" || !this.dialogPanel) return;

    if (event.key === "Escape") {
      event.preventDefault();

      if (!this.processing) {
        this.cancel.emit();
      }

      return;
    }

    if (event.key !== "Tab") return;

    const controls = Array.from(
      this.dialogPanel.nativeElement.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), [tabindex="0"]',
      ),
    );

    if (controls.length === 0) {
      event.preventDefault();
      return;
    }

    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = this.dialogPanel.nativeElement.ownerDocument.activeElement;

    if (
      event.shiftKey &&
      (active === first || !controls.includes(active as HTMLElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (active === last || !controls.includes(active as HTMLElement))
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  private readonly destroyRef = inject(DestroyRef);
  private formSubscription?: Subscription;

  readonly formInvalid = signal(true);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.formSubscription?.unsubscribe();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["operation"] && this.operation === "remove") {
      queueMicrotask(() => this.focusRemovalPassword());
    }

    if (!changes["form"]) return;

    this.formSubscription?.unsubscribe();

    if (!this.form) {
      this.formInvalid.set(true);
      return;
    }

    this.formInvalid.set(this.form.invalid);

    this.formSubscription = this.form.statusChanges.subscribe(() => {
      this.formInvalid.set(this.form.invalid);
    });
  }

  @Input({ required: true }) role!: UserRole;
  @Input({ required: true }) operation!: BulkRoleOperation;
  @Input({ required: true }) selectedCount = 0;
  @Input({ required: true }) form!: UserRoleReauthenticationForm;

  @Input() processing = false;
  @Input() passwordError: string | null = null;

  @Output() readonly confirm = new EventEmitter<void>();
  @Output() readonly cancel = new EventEmitter<void>();

  confirmOperation(): void {
    if (
      this.processing ||
      this.form.invalid ||
      this.selectedCount < 1 ||
      this.selectedCount > 100 ||
      this.role.code === "ROL_ADMIN_SISTEMA"
    ) {
      return;
    }

    this.confirm.emit();
  }
}
