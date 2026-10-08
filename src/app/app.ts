import { Component } from '@angular/core';
// El nombre exacto del archivo '.ts' y de la clase puede variar ligeramente según lo generó Angular.
import { Login } from './presentation/pages/login/login'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Login], // Inyectamos el Login
  templateUrl: './app.html'
})
export class App {}