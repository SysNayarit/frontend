import { Routes } from '@angular/router';
import { CreatePersonaPage } from './presentation/pages/create-persona/create-persona.page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'personas/nueva',
    pathMatch: 'full'
  },
  {
    path: 'personas/nueva',
    component: CreatePersonaPage
  },
  {
    path: '**',
    redirectTo: 'personas/nueva'
  }
];