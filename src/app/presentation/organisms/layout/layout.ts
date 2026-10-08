import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule], // Añadimos RouterModule aquí
  templateUrl: './layout.html'
})
export class Layout {}