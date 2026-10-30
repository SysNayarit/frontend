import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { sessionRevocationInterceptor } from './app/auth/session-revocation.interceptor';

import { App } from './app/app';
import { routes } from './app/app.routes';

bootstrapApplication(App, {
  providers: [
    provideHttpClient(withInterceptors([sessionRevocationInterceptor])),
    provideRouter(routes),
  ],
}).catch((error: unknown) => console.error(error));
