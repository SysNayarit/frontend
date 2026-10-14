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
export interface PersonCreateRequest {
  nombres: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  fecha_nacimiento?: string | null;
  sexo?: string | null;
  estado_civil?: string | null;
}
export interface PersonDetail {
  id_persona: string;
  curp: string | null;
  rfc: string | null;
  num_expediente: string;
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  estado_civil: string | null;
  correo_institucional: string | null;
  correo_personal: string | null;
  id_pais_origen: string | null;
  id_pais_nacimiento: string | null;
  id_territorio_nacimiento: string | null;
  fecha_alta: string;
  fecha_baja: string | null;
  estatus: string;
}
