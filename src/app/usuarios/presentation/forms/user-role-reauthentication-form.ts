import { FormControl, FormGroup, Validators } from "@angular/forms";

export type UserRoleReauthenticationForm = FormGroup<{
  password: FormControl<string>;
}>;

export function createUserRoleReauthenticationForm(): UserRoleReauthenticationForm {
  return new FormGroup({
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
}