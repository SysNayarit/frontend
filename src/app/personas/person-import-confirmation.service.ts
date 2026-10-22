import { inject, Injectable } from "@angular/core";
import { catchError, defer, Observable, switchMap, throwError } from "rxjs";

import { AuthService } from "../auth/auth.service";
import { PersonImportUploadResponse } from "./person-import.models";
import { PersonImportService } from "./person-import.service";

export type PersonImportConfirmationErrorStage =
  | "reauthentication"
  | "confirmation";

export class PersonImportConfirmationError extends Error {
  constructor(
    readonly stage: PersonImportConfirmationErrorStage,
    readonly originalError: unknown,
  ) {
    super("Falló la confirmación de una importación de personas.");
    this.name = "PersonImportConfirmationError";
  }
}

@Injectable({
  providedIn: "root",
})
export class PersonImportConfirmationService {
  private readonly auth = inject(AuthService);
  private readonly imports = inject(PersonImportService);

  confirm(
    batchUuid: string,
    password: string,
  ): Observable<PersonImportUploadResponse> {
    return this.auth.reauthenticate(password).pipe(
      catchError((error: unknown) =>
        throwError(
          () => new PersonImportConfirmationError("reauthentication", error),
        ),
      ),
      switchMap(() =>
        defer(() => this.imports.confirmBatch(batchUuid)).pipe(
          catchError((error: unknown) =>
            throwError(
              () => new PersonImportConfirmationError("confirmation", error),
            ),
          ),
        ),
      ),
    );
  }
}
