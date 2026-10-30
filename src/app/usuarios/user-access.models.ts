export type UserAccessStatus = "PENDIENTE" | "HABILITADO" | "DESHABILITADO";
export type UserAccessOperation = "enable" | "disable";
export interface UserAccessResponse {
  id: number;
  id_persona: string | null;
  access_status: UserAccessStatus;
  access_version: number;
}
