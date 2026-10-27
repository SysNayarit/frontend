export interface UserPersonSummary {
  id_persona: string;
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
}

export interface UserSummary {
  id: number;
  id_persona: string | null;
  name: string;
  email: string;
  created_at: string;
  person: UserPersonSummary | null;
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