import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Persona } from '../../../domain/models/persona.model';

@Component({
  selector: 'app-persona-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './persona-table.component.html',
  styleUrl: './persona-table.component.css'
})
export class PersonaTableComponent {
  @Input() personas: Persona[] = [];
}