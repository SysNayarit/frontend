export interface PersonListItem {
  id_persona: string;
  num_expediente: string;
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  estatus: string;
}

export interface PersonListMeta {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

export interface PersonListResponse {
  data: PersonListItem[];
  meta: PersonListMeta;
}
