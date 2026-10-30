import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { UserAccessStatus } from "../../../user-access.models";

@Component({
  selector: "app-user-access-status-badge",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    data-testid="user-access-status"
    class="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium"
    [class]="
      status === 'HABILITADO'
        ? 'border-green-200 bg-green-50 text-green-800'
        : status === 'DESHABILITADO'
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-amber-200 bg-amber-50 text-amber-900'
    "
    >{{ label }}</span
  >`,
})
export class UserAccessStatusBadgeComponent {
  @Input() status: UserAccessStatus | undefined;
  get label(): string {
    switch (this.status) {
      case "HABILITADO":
        return "Habilitado";
      case "DESHABILITADO":
        return "Deshabilitado";
      case "PENDIENTE":
        return "Pendiente de habilitación";
      default:
        return "Estado no informado";
    }
  }
}
