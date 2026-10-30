export interface UserPersonSummary {
  id_persona: string;
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
}

import { UserAccessStatus } from "./user-access.models";

export interface UserSummary {
  access_status?: UserAccessStatus;
  id: number;
  id_persona: string | null;
  name: string;
  email: string;
  created_at: string;
  person: UserPersonSummary | null;
  roles?: readonly {
    id: number;
    code: string;
    name: string;
  }[];
}

export interface UserPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface UserListResponse {
  data: UserSummary[];
  meta: UserPaginationMeta;
}
export interface UserCreateRequest {
  id_persona: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface UserCreateResponse {
  access_status?: UserAccessStatus;
  id: number;
  id_persona: string;
  name: string;
  email: string;
}
export interface AvailablePerson {
  id_persona: string;
  num_expediente: string | number;
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  estatus: string;
  fecha_registro?: string | null;
  forma_registro?: "INDIVIDUAL" | "MASIVO" | "NO_DETERMINADO";
}

export interface AvailablePersonsResponse {
  data: AvailablePerson[];
  meta: UserPaginationMeta;
}
