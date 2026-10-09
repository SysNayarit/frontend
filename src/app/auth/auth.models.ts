export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthenticatedPerson {
  id_persona: string;
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
}

export interface AuthenticatedUser {
  id: number;
  id_persona: string | null;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  person: AuthenticatedPerson | null;
}
