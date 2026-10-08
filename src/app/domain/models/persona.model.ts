export interface Persona {
  id_persona: string;
  curp?: string;
  rfc?: string;
  num_expediente: string;
  nombres: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  fecha_nacimiento?: string;
  sexo?: 'MASCULINO' | 'FEMENINO';
  estado_civil?: 'SOLTERO' | 'CASADO';
  correo_institucional?: string;
  correo_personal?: string;
  id_pais_origen?: string;
  id_pais_nacimiento?: string;
  id_territorio_nacimiento?: string;
  fecha_alta: string;
  fecha_baja?: string;
  estatus: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'BAJA';
  created_at: string;
  updated_at: string;
}

export interface CreatePersonaDTO {
  nombres: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  curp?: string;
  rfc?: string;
  fecha_nacimiento?: string;
  sexo?: 'MASCULINO' | 'FEMENINO';
  estado_civil?: 'SOLTERO' | 'CASADO';
  correo_institucional?: string;
  correo_personal?: string;
  id_pais_origen?: string;
  id_pais_nacimiento?: string;
  id_territorio_nacimiento?: string;
}