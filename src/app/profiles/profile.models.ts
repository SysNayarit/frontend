export interface Profile {
  id: number;
  name: string;
  code: string;
  is_default: boolean;
}

export interface ProfileListResponse {
  data: Profile[];
}

export interface ProfileResponse {
  data: Profile;
}
