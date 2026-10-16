import { inject, Injectable } from "@angular/core";
import { catchError, defer, Observable, switchMap, throwError } from "rxjs";

import { AuthService } from "../auth/auth.service";
import { PersonDetail } from "./person.models";
import { PersonService } from "./person.service";

export type PersonLifecycleErrorStage = "reauthentication" | "operation";

export class PersonLifecycleError extends Error {
  constructor(
    readonly stage: PersonLifecycleErrorStage,
    readonly originalError: unknown,
  ) {
    super("Falló una operación sensible de Persona.");
    this.name = "PersonLifecycleError";
  }
}

@Injectable({
  providedIn: "root",
})
export class PersonLifecycleService {
  private readonly auth = inject(AuthService);

  private readonly persons = inject(PersonService);

  withdraw(idPersona: string, password: string): Observable<PersonDetail> {
    return this.execute(password, () => this.persons.withdraw(idPersona));
  }

  reinstate(idPersona: string, password: string): Observable<PersonDetail> {
    return this.execute(password, () => this.persons.reinstate(idPersona));
  }

  private execute(
    password: string,
    operation: () => Observable<PersonDetail>,
  ): Observable<PersonDetail> {
    return this.auth.reauthenticate(password).pipe(
      catchError((error: unknown) =>
        throwError(() => new PersonLifecycleError("reauthentication", error)),
      ),
      switchMap(() =>
        defer(operation).pipe(
          catchError((error: unknown) =>
            throwError(() => new PersonLifecycleError("operation", error)),
          ),
        ),
      ),
    );
  }
}
