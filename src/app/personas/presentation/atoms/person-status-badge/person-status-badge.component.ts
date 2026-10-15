import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

@Component({
  selector: 'app-person-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
  template: `
    <span
      class="rounded-full border border-[#a57f2c]/30 bg-white px-3 py-1 text-sm font-semibold text-[#611232]"
    >
      {{ status }}
    </span>
  `,
})
export class PersonStatusBadgeComponent {
  @Input({ required: true })
  status!: string;
}