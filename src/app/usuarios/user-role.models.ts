export interface UserRole {
  id: number;
  code: string;
  name: string;
}

export interface UserRoleListResponse {
  data: UserRole[];
}

export interface AssignUserRoleRequest {
  role_id: number;
}

export interface AssignUserRoleResponse {
  user_id: number;
  role_id: number;
  assigned: boolean;
}

export interface RemoveUserRoleResponse {
  user_id: number;
  role_id: number;
  removed: boolean;
}