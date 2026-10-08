import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { PersonaRepository } from './domain/repositories/persona.repository';
import { PersonaHttpRepository } from './infrastructure/repositories/persona-http.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    {
      provide: PersonaRepository,
      useClass: PersonaHttpRepository
    }
  ]
};