import { FormControl, FormGroup } from "@angular/forms";

export type PersonReauthenticationForm = FormGroup<{
  password: FormControl<string>;
}>;

export function createPersonReauthenticationForm(): PersonReauthenticationForm {
  return new FormGroup({
    password: new FormControl("", {
      nonNullable: true,
    }),
  });
}
